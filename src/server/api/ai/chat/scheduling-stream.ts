import type { H3Event } from 'h3';
import type { ChatMessage } from '../../../ai/deepseek.helpers';
import { normalizeChatHistoryItem } from '../../../ai/deepseek.helpers';
import { runSchedulingToolLoop } from './chat-tool-loop';
import { buildSchedulingDateContext } from './scheduling-availability';

type StreamOptions = {
  streamErrorMessage?: string;
  onError?: (error: unknown) => void;
  onCompleted?: () => void;
};

function writeSseData(event: H3Event, payload: unknown, flush = false): void {
  event.node.res.write(`data: ${JSON.stringify(payload)}\n\n`);

  if (flush && typeof (event.node.res as unknown as { flush?: () => void }).flush === 'function') {
    (event.node.res as unknown as { flush: () => void }).flush();
  }
}

function endSse(event: H3Event): void {
  if (!event.node.res.writableEnded) {
    event.node.res.end();
  }
}

function writeSseError(event: H3Event, message: string): void {
  writeSseData(event, { error: message });
  endSse(event);
}

function toChatMessages(history: unknown[], systemInstruction: string, message: string): ChatMessage[] {
  const messages: ChatMessage[] = [{ role: 'system', content: systemInstruction }];

  for (const item of history) {
    const normalized = normalizeChatHistoryItem(item as Parameters<typeof normalizeChatHistoryItem>[0]);
    if (normalized) {
      messages.push(normalized);
    }
  }

  messages.push({ role: 'user', content: message });
  return messages;
}

function streamTextAsTokens(event: H3Event, text: string): void {
  const chunkSize = 24;
  for (let index = 0; index < text.length; index += chunkSize) {
    writeSseData(event, { token: text.slice(index, index + chunkSize) }, true);
  }
}

export async function streamSchedulingChatResponse(
  event: H3Event,
  input: {
    systemInstruction: string;
    history: unknown[];
    message: string;
    model: string;
    sessionId?: string;
    maxOutputTokens?: number;
  },
  options: StreamOptions = {},
): Promise<boolean> {
  try {
    writeSseData(event, { ready: true }, true);

    const messages = toChatMessages(input.history, [input.systemInstruction, buildSchedulingDateContext()].filter(Boolean).join('\n'), input.message);
    const completion = await runSchedulingToolLoop(messages, {
      model: input.model,
      maxOutputTokens: input.maxOutputTokens,
      sessionId: input.sessionId,
    });

    const responseText = completion.content.trim();
    if (responseText.length > 0) {
      streamTextAsTokens(event, responseText);
    }

    writeSseData(event, { done: true });
    options.onCompleted?.();
    endSse(event);
    return true;
  } catch (error) {
    options.onError?.(error);
    writeSseError(event, options.streamErrorMessage ?? 'Error processing AI response.');
    return false;
  }
}
