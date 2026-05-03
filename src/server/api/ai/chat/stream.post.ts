import { defineEventHandler, getRequestIP, setHeader } from 'h3';
import { DEFAULT_DEEPSEEK_CHAT_MODEL, getAIClient } from '../../../ai/deepseek.client';
import { prisma } from '../../../db/client';
import { profileRepository } from '../../../db/repositories/profile.repository';
import { defaultProfile } from '../../../data/default-profile';
import { generateRequestId, logChatInteraction } from '../../../ai/chat-security';
import { buildIntentHint, buildSystemInstruction, detectResponseMode, normalizeProjectSummary } from './prompt-helpers';
import { parseAndValidatePostChatRequest } from './stream-request-utils';
import { applySseHeaders, createChatModelSafe, streamChatResponseSafe, writeSseError } from './stream-utils';
import { resolveVisitorContextString } from './visitor-context';
import { readPositiveIntFromEnv, rateLimiter } from '../../../utils/rate-limiter';

const CHAT_SESSION_WINDOW_MS = readPositiveIntFromEnv('AI_CHAT_SESSION_WINDOW_MS', 60_000);
const CHAT_SESSION_MAX_REQUESTS = readPositiveIntFromEnv('AI_CHAT_SESSION_MAX_REQUESTS', 10);
const CHAT_GLOBAL_WINDOW_MS = readPositiveIntFromEnv('AI_CHAT_GLOBAL_WINDOW_MS', 60_000);
const CHAT_GLOBAL_MAX_REQUESTS = readPositiveIntFromEnv('AI_CHAT_GLOBAL_MAX_REQUESTS', 40);
const CHAT_RATE_LIMITER_NAMESPACE = 'ai:chat';

export default defineEventHandler(async (event) => {
  const requestId = generateRequestId();
  setHeader(event, 'X-Request-ID', requestId);
  applySseHeaders(event);

  try {
    const request = await parseAndValidatePostChatRequest(event, requestId, logChatInteraction);
    if (!request) {
      return;
    }

    const { message, history, sessionId } = request;
    const limiterKey = sessionId ?? `ip:${getRequestIP(event) ?? 'unknown'}`;

    const sessionRateLimit = await rateLimiter.checkRateLimit(
      CHAT_RATE_LIMITER_NAMESPACE,
      `session:${limiterKey}`,
      {
        maxRequests: CHAT_SESSION_MAX_REQUESTS,
        windowMs: CHAT_SESSION_WINDOW_MS,
      },
    );
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

    logChatInteraction(requestId, sessionId, message, 'started');

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

    const visitorContextString = await resolveVisitorContextString(sessionId, '[chat-stream] visitor context fetch failed');

    const model = createChatModelSafe(
      event,
      () =>
        getAIClient().getGenerativeModel({
          model: DEFAULT_DEEPSEEK_CHAT_MODEL,
          systemInstruction: buildSystemInstruction(baseProfile, projectSummary, visitorContextString, responseMode, intentHint),
        }),
      {
        onError: (error) => logChatInteraction(requestId, sessionId, message, 'error', error as Error),
      }
    );

    if (!model) {
      return;
    }

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 800,
      },
    });

    await streamChatResponseSafe(event, chat, message, {
      onCompleted: () => logChatInteraction(requestId, sessionId, message, 'completed'),
      onError: (error) => logChatInteraction(requestId, sessionId, message, 'error', error as Error),
    });
  } catch (error) {
    logChatInteraction(requestId, undefined, '[handler-error]', 'error', error as Error);
    if (!event.node.res.writableEnded) {
      writeSseError(event, 'Internal server error.');
    }
  }
});
