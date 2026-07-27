import type { H3Event } from 'h3';
import { prisma } from '../../../db/client';
import { profileRepository } from '../../../db/repositories/profile.repository';
import { defaultProfile } from '../../../data/default-profile';
import { readPositiveIntFromEnv } from '../../../utils/env.util';
import { rateLimiter } from '../../../utils/rate-limiter';
import { buildIntentHint, detectResponseMode, normalizeProjectSummary } from './prompt-helpers';
import { writeSseError } from './stream-utils';

const CHAT_SESSION_WINDOW_MS = readPositiveIntFromEnv('AI_CHAT_SESSION_WINDOW_MS', 60_000);
const CHAT_SESSION_MAX_REQUESTS = readPositiveIntFromEnv('AI_CHAT_SESSION_MAX_REQUESTS', 10);
const CHAT_GLOBAL_WINDOW_MS = readPositiveIntFromEnv('AI_CHAT_GLOBAL_WINDOW_MS', 60_000);
const CHAT_GLOBAL_MAX_REQUESTS = readPositiveIntFromEnv('AI_CHAT_GLOBAL_MAX_REQUESTS', 40);
const CHAT_RATE_LIMITER_NAMESPACE = 'ai:chat';

export async function enforceChatRateLimits(event: H3Event, limiterKey: string): Promise<boolean> {
  const sessionRateLimit = await rateLimiter.checkRateLimit(CHAT_RATE_LIMITER_NAMESPACE, `session:${limiterKey}`, {
    maxRequests: CHAT_SESSION_MAX_REQUESTS,
    windowMs: CHAT_SESSION_WINDOW_MS,
  });
  if (!sessionRateLimit.allowed) {
    event.node.res.statusCode = 429;
    writeSseError(event, 'Chat rate limit exceeded. Please slow down.');
    return false;
  }

  const globalRateLimit = await rateLimiter.checkRateLimit(CHAT_RATE_LIMITER_NAMESPACE, 'global', {
    maxRequests: CHAT_GLOBAL_MAX_REQUESTS,
    windowMs: CHAT_GLOBAL_WINDOW_MS,
  });
  if (!globalRateLimit.allowed) {
    event.node.res.statusCode = 429;
    writeSseError(event, 'Global chat rate limit exceeded. Please retry later.');
    return false;
  }

  return true;
}

export async function loadChatPromptContext(message: string) {
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

  return { baseProfile, projectSummary, responseMode, intentHint };
}
