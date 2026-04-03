import type { GenerativeModel } from '@google/generative-ai';
import type { H3Event } from 'h3';

type StreamChunk = { text(): string };
type StreamResponse = { stream: AsyncIterable<StreamChunk> };
type StreamingChat = {
  sendMessageStream(message: string): Promise<StreamResponse>;
};

type CreateModelOptions = {
  unavailableMessage?: string;
  onError?: (error: unknown) => void;
};

type StreamOptions = {
  streamErrorMessage?: string;
  onError?: (error: unknown) => void;
  onCompleted?: () => void;
};

function writeSseData(event: H3Event, payload: unknown, flush = false): void {
  event.node.res.write(`data: ${JSON.stringify(payload)}\n\n`);

  if (flush && typeof (event.node.res as any).flush === 'function') {
    (event.node.res as any).flush();
  }
}

function endSse(event: H3Event): void {
  if (!event.node.res.writableEnded) {
    event.node.res.end();
  }
}

export function createChatModelSafe(event: H3Event, factory: () => GenerativeModel, options: CreateModelOptions = {}): GenerativeModel | null {
  try {
    return factory();
  } catch (error) {
    options.onError?.(error);
    writeSseData(event, { error: options.unavailableMessage ?? 'AI service unavailable.' });
    endSse(event);
    return null;
  }
}

export async function streamChatResponseSafe(
  event: H3Event,
  chat: StreamingChat,
  message: string,
  options: StreamOptions = {}
): Promise<boolean> {
  try {
    const stream = await chat.sendMessageStream(message);

    for await (const chunk of stream.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        writeSseData(event, { token: chunkText }, true);
      }
    }

    writeSseData(event, { done: true });
    options.onCompleted?.();
    endSse(event);
    return true;
  } catch (error) {
    options.onError?.(error);
    writeSseData(event, { error: options.streamErrorMessage ?? 'Error processing AI response.' });
    endSse(event);
    return false;
  }
}

