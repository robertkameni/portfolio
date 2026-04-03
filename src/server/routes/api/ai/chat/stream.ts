import { defineEventHandler, getQuery } from 'h3';
import { getGeminiClient } from '../../../../ai/gemini.client';
import { prisma } from '../../../../db/client';
import { profileRepository } from '../../../../db/repositories/profile.repository';
import { defaultProfile } from '../../../../data/default-profile';
import { buildIntentHint, buildSystemInstruction, detectResponseMode, normalizeProjectSummary } from './prompt-helpers';
import { createChatModelSafe, streamChatResponseSafe } from './stream-utils';
import { resolveVisitorContextString } from './visitor-context';


export default defineEventHandler(async (event) => {
  event.node.res.setHeader('Content-Type', 'text/event-stream');
  event.node.res.setHeader('Cache-Control', 'no-cache');
  event.node.res.setHeader('Connection', 'keep-alive');
  event.node.res.setHeader('X-Accel-Buffering', 'no');

  const { sessionId, message, history } = getQuery(event);

  if (!message || typeof message !== 'string') {
    event.node.res.write(`data: ${JSON.stringify({ error: 'No message provided.' })}\n\n`);
    event.node.res.end();
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

  // 1. Parse the history passed from the frontend
  let parsedHistory: any[] = [];
  if (typeof history === 'string') {
    try {
      parsedHistory = JSON.parse(history);
    } catch (e) {
      console.error('[SSE] Failed to parse chat history:', e);
    }
  }

  // 2. Fetch visitor classification to adapt the style and focus.
  visitorContextString = await resolveVisitorContextString(
    typeof sessionId === 'string' ? sessionId : undefined,
    '[SSE] Failed to fetch visitor profile for context'
  );

  const model = createChatModelSafe(event, () =>
    getGeminiClient().getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemInstruction(baseProfile, projectSummary, visitorContextString, responseMode, intentHint),
    })
  );

  if (!model) {
    return;
  }

  const chat = model.startChat({
    history: parsedHistory,
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
