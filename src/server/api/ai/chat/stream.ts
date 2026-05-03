import { defineEventHandler, getRequestIP } from 'h3';
import { DEFAULT_DEEPSEEK_CHAT_MODEL, getAIClient } from '../../../ai/deepseek.client';
import { prisma } from '../../../db/client';
import { profileRepository } from '../../../db/repositories/profile.repository';
import { defaultProfile } from '../../../data/default-profile';
import { buildIntentHint, buildSystemInstruction, detectResponseMode, normalizeProjectSummary } from './prompt-helpers';
import { parseAndValidateGetChatRequest } from './stream-request-utils';
import { applySseHeaders, createChatModelSafe, streamChatResponseSafe, writeSseError } from './stream-utils';
import { resolveVisitorContextString } from './visitor-context';
import { readPositiveIntFromEnv, rateLimiter } from '../../../utils/rate-limiter';

const CHAT_SESSION_WINDOW_MS = readPositiveIntFromEnv('AI_CHAT_SESSION_WINDOW_MS', 60_000);
const CHAT_SESSION_MAX_REQUESTS = readPositiveIntFromEnv('AI_CHAT_SESSION_MAX_REQUESTS', 10);
const CHAT_GLOBAL_WINDOW_MS = readPositiveIntFromEnv('AI_CHAT_GLOBAL_WINDOW_MS', 60_000);
const CHAT_GLOBAL_MAX_REQUESTS = readPositiveIntFromEnv('AI_CHAT_GLOBAL_MAX_REQUESTS', 40);
const CHAT_RATE_LIMITER_NAMESPACE = 'ai:chat';

export default defineEventHandler(async (event) => {
  applySseHeaders(event);

  const request = parseAndValidateGetChatRequest(event);
  if (!request) {
    return;
  }

  const { sessionId, message, history } = request;
  const limiterKey = sessionId ?? `ip:${getRequestIP(event) ?? 'unknown'}`;

  const sessionRateLimit = await rateLimiter.checkRateLimit(CHAT_RATE_LIMITER_NAMESPACE, `session:${limiterKey}`, {
    maxRequests: CHAT_SESSION_MAX_REQUESTS,
    windowMs: CHAT_SESSION_WINDOW_MS,
  });
  if (!sessionRateLimit.allowed) {
    event.node.res.statusCode = 429;
    writeSseError(event, 'Chat rate limit exceeded. Please slow down.');
    return;
  }

  const globalRateLimit = await rateLimiter.checkRateLimit(CHAT_RATE_LIMITER_NAMESPACE, 'global', {
    maxRequests: CHAT_GLOBAL_MAX_REQUESTS,
    windowMs: CHAT_GLOBAL_WINDOW_MS,
  });
  if (!globalRateLimit.allowed) {
    event.node.res.statusCode = 429;
    writeSseError(event, 'Global chat rate limit exceeded. Please retry later.');
    return;
  }

  const baseProfile = (await profileRepository.find()) ?? defaultProfile;
  const publishedProjects = await prisma.project.findMany({
    where: { isPublished: true },
    select: { title: true, description: true, tags: true },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  });
  const projectSummary = normalizeProjectSummary(publishedProjects);
  const responseMode = detectResponseMode(message);
  const intentHint = buildIntentHint(message);

  let visitorContextString = '';

  // Fetch visitor classification to adapt the style and focus.
  visitorContextString = await resolveVisitorContextString(sessionId, '[SSE] Failed to fetch visitor profile for context');

  const model = createChatModelSafe(event, () =>
    getAIClient().getGenerativeModel({
      model: DEFAULT_DEEPSEEK_CHAT_MODEL,
      systemInstruction: buildSystemInstruction(baseProfile, projectSummary, visitorContextString, responseMode, intentHint),
    }),
  );

  if (!model) {
    return;
  }

  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 800,
    },
  });

  await streamChatResponseSafe(event, chat, message);

  event.node.req.on('close', () => {
    // Client disconnected
  });

  return new Promise(() => {});
});
