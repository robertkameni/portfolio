import {createError, defineEventHandler, readBody, setHeader} from 'h3';
import {getGeminiClient} from '../../../../ai/gemini.client';
import {prisma} from '../../../../db/client';
import {profileRepository} from '../../../../db/repositories/profile.repository';
import {defaultProfile} from '../../../../data/default-profile';
import {generateRequestId, logChatInteraction, validateChatInput} from '../../../../ai/chat-security';
import {buildIntentHint, buildSystemInstruction, detectResponseMode, normalizeProjectSummary} from './prompt-helpers';
import {createChatModelSafe, streamChatResponseSafe} from './stream-utils';
import {resolveVisitorContextString} from './visitor-context';

interface ChatRequestBody {
  message: string;
  history?: any[];
  sessionId?: string;
}


export default defineEventHandler(async (event) => {
  const requestId = generateRequestId();
  setHeader(event, 'X-Request-ID', requestId);

  try {
    // Validate request method
    if (event.node.req.method !== 'POST') {
      throw createError({statusCode: 405, statusMessage: 'Method not allowed. Use POST.'});
    }

    // Parse and validate body
    let body: ChatRequestBody;
    try {
      body = await readBody(event);
    } catch (error) {
      logChatInteraction(requestId, undefined, '[parse-error]', 'error', error as Error);
      throw createError({statusCode: 400, statusMessage: 'Invalid request body'});
    }

    const {message, history = [], sessionId} = body;

    // Validate input
    const validation = validateChatInput(message, history);
    if (!validation.valid) {
      logChatInteraction(requestId, sessionId, message || '[empty]', 'error', new Error(validation.error));
      throw createError({statusCode: 400, statusMessage: validation.error});
    }

    logChatInteraction(requestId, sessionId, message, 'started');

    // Set SSE headers
    event.node.res.setHeader('Content-Type', 'text/event-stream');
    event.node.res.setHeader('Cache-Control', 'no-cache');
    event.node.res.setHeader('Connection', 'keep-alive');
    event.node.res.setHeader('X-Accel-Buffering', 'no');

    const baseProfile = (await profileRepository.find()) ?? defaultProfile;
    const publishedProjects = await prisma.project.findMany({
      where: {isPublished: true},
      select: {title: true, description: true, tags: true},
      orderBy: {updatedAt: 'desc'},
      take: 6
    });
    const projectSummary = normalizeProjectSummary(publishedProjects);
    const responseMode = detectResponseMode(message);
    const intentHint = buildIntentHint(message);

    const visitorContextString = await resolveVisitorContextString(sessionId, '[chat-stream] visitor context fetch failed');

    const model = createChatModelSafe(
      event,
      () =>
        getGeminiClient().getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: buildSystemInstruction(baseProfile, projectSummary, visitorContextString, responseMode, intentHint)
        }),
      {
        onError: (error) => logChatInteraction(requestId, sessionId, message, 'error', error as Error)
      }
    );

    if (!model) {
      return;
    }

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 800
      }
    });

    await streamChatResponseSafe(event, chat, message, {
      onCompleted: () => logChatInteraction(requestId, sessionId, message, 'completed'),
      onError: (error) => logChatInteraction(requestId, sessionId, message, 'error', error as Error)
    });
  } catch (error) {
    logChatInteraction(requestId, undefined, '[handler-error]', 'error', error as Error);
    if (!event.node.res.headersSent) {
      event.node.res.write(`data: ${JSON.stringify({error: 'Internal server error.'})}\n\n`);
      event.node.res.end();
    } else if (!event.node.res.writableEnded) {
      event.node.res.end();
    }
  }
});

