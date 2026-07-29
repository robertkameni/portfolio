import { defineEventHandler, getRequestIP, setHeader, type H3Event } from 'h3';
import { DEFAULT_DEEPSEEK_CHAT_MODEL, getAIClient } from '../../../ai/deepseek.client';
import { generateRequestId, logChatInteraction } from '../../../ai/chat-security';
import { isCalcomConfigured } from '../../../utils/env.util';
import { buildSystemInstruction } from './prompt-helpers';
import { parseAndValidatePostChatRequest } from './stream-request-utils';
import { applySseHeaders, createChatModelSafe, streamChatResponseSafe, writeSseError } from './stream-utils';
import { resolveVisitorContextString } from './visitor-context';
import { enforceChatRateLimits, loadChatPromptContext } from './chat-stream-shared';
import { detectSchedulingIntent, extractEmailFromMessage } from './intent-router';
import { isSchedulingMode, setSchedulingMode, setEmailConfirmation } from './conversation-state';
import { streamSchedulingChatResponse } from './scheduling-stream';
import { streamSchedulingFallbackResponse } from './scheduling-fallback';

export async function handleChatStreamPost(event: H3Event): Promise<void> {
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

    if (!(await enforceChatRateLimits(event, limiterKey))) {
      return;
    }

    if (detectSchedulingIntent(message)) {
      setSchedulingMode(limiterKey, true);
    }

    const emailInMessage = extractEmailFromMessage(message);
    if (emailInMessage && (isSchedulingMode(limiterKey) || detectSchedulingIntent(message))) {
      setEmailConfirmation(limiterKey, emailInMessage);
    }

    logChatInteraction(requestId, sessionId, message, 'started');

    const { baseProfile, projectSummary, responseMode, intentHint } = await loadChatPromptContext(message);
    const visitorContextString = await resolveVisitorContextString(sessionId, '[chat-stream] visitor context fetch failed');
    const schedulingMode = isSchedulingMode(limiterKey);
    const calcomEnabled = isCalcomConfigured();

    const systemInstruction = buildSystemInstruction(baseProfile, projectSummary, visitorContextString, responseMode, intentHint, {
      schedulingMode,
      calcomEnabled,
    });

    if (schedulingMode && calcomEnabled) {
      await streamSchedulingChatResponse(
        event,
        {
          systemInstruction,
          history,
          message,
          model: DEFAULT_DEEPSEEK_CHAT_MODEL,
          sessionId: limiterKey,
          maxOutputTokens: 800,
        },
        {
          onCompleted: () => logChatInteraction(requestId, sessionId, message, 'completed'),
          onError: (error) => logChatInteraction(requestId, sessionId, message, 'error', error as Error),
        },
      );
      return;
    }

    if (schedulingMode && !calcomEnabled) {
      await streamSchedulingFallbackResponse(event, {
        onCompleted: () => logChatInteraction(requestId, sessionId, message, 'completed'),
      });
      return;
    }

    const model = createChatModelSafe(
      event,
      () =>
        getAIClient().getGenerativeModel({
          model: DEFAULT_DEEPSEEK_CHAT_MODEL,
          systemInstruction,
        }),
      {
        onError: (error) => logChatInteraction(requestId, sessionId, message, 'error', error as Error),
      },
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
}

export default defineEventHandler(handleChatStreamPost);
