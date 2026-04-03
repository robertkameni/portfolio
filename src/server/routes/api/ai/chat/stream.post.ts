import {defineEventHandler, setHeader} from 'h3';
import {getGeminiClient} from '../../../../ai/gemini.client';
import {prisma} from '../../../../db/client';
import {profileRepository} from '../../../../db/repositories/profile.repository';
import {defaultProfile} from '../../../../data/default-profile';
import {generateRequestId, logChatInteraction} from '../../../../ai/chat-security';
import {buildIntentHint, buildSystemInstruction, detectResponseMode, normalizeProjectSummary} from './prompt-helpers';
import {parseAndValidatePostChatRequest} from './stream-request-utils';
import {applySseHeaders, createChatModelSafe, streamChatResponseSafe, writeSseError} from './stream-utils';
import {resolveVisitorContextString} from './visitor-context';


export default defineEventHandler(async (event) => {
  const requestId = generateRequestId();
  setHeader(event, 'X-Request-ID', requestId);
  applySseHeaders(event);

  try {
    const request = await parseAndValidatePostChatRequest(event, requestId, logChatInteraction);
    if (!request) {
      return;
    }


    const {message, history, sessionId} = request;
    logChatInteraction(requestId, sessionId, message, 'started');

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
    if (!event.node.res.writableEnded) {
      writeSseError(event, 'Internal server error.');
    }
  }
});

