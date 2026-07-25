import { readBody, type H3Event } from 'h3';
import { validateChatInput } from '../../../ai/chat-security';
import { writeSseError } from './stream-utils';

type ChatRequestBody = {
  message?: unknown;
  history?: unknown;
  sessionId?: unknown;
};

type ChatRequest = {
  message: string;
  history: unknown[];
  sessionId?: string;
};

type ChatLogFn = (requestId: string, sessionId: string | undefined, message: string, status: 'started' | 'completed' | 'error', error?: Error) => void;

export async function parseAndValidatePostChatRequest(event: H3Event, requestId: string, logChatInteraction: ChatLogFn): Promise<ChatRequest | null> {
  if (event.node.req.method !== 'POST') {
    const methodError = new Error('Method not allowed. Use POST.');
    logChatInteraction(requestId, undefined, '[method-error]', 'error', methodError);
    writeSseError(event, methodError.message);
    return null;
  }

  let body: ChatRequestBody;
  try {
    body = await readBody<ChatRequestBody>(event);
  } catch (error) {
    logChatInteraction(requestId, undefined, '[parse-error]', 'error', error as Error);
    writeSseError(event, 'Invalid request body');
    return null;
  }

  const message = typeof body.message === 'string' ? body.message : '';
  const history = Array.isArray(body.history) ? body.history : [];
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : undefined;

  const validation = validateChatInput(message, history);
  if (!validation.valid) {
    logChatInteraction(requestId, sessionId, message || '[empty]', 'error', new Error(validation.error));
    writeSseError(event, validation.error ?? 'Invalid chat request.');
    return null;
  }

  return { message, history, sessionId };
}
