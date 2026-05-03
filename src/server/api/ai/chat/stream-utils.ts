import type { H3Event } from 'h3';

type StreamChunk = { text(): string };
type StreamResponse = { stream: AsyncIterable<StreamChunk> };
type StreamingChat = {
  sendMessageStream(message: string): Promise<StreamResponse>;
};

type ChatModel = {
  startChat: (options: {
    history?: unknown[];
    generationConfig?: {
      maxOutputTokens?: number;
    };
  }) => StreamingChat;
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

export function applySseHeaders(event: H3Event): void {
  event.node.res.setHeader('Content-Type', 'text/event-stream');
  event.node.res.setHeader('Cache-Control', 'no-cache, no-transform');
  event.node.res.setHeader('Connection', 'keep-alive');
  event.node.res.setHeader('X-Accel-Buffering', 'no');
}

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

export function writeSseError(event: H3Event, message: string): void {
  writeSseData(event, { error: message });
  endSse(event);
}

export function createChatModelSafe(event: H3Event, factory: () => ChatModel, options: CreateModelOptions = {}): ChatModel | null {
  try {
    return factory();
  } catch (error) {
    options.onError?.(error);
    writeSseError(event, options.unavailableMessage ?? 'AI service unavailable.');
    return null;
  }
}

export async function streamChatResponseSafe(event: H3Event, chat: StreamingChat, message: string, options: StreamOptions = {}): Promise<boolean> {
  try {
    writeSseData(event, { ready: true }, true);
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
    writeSseError(event, options.streamErrorMessage ?? 'Error processing AI response.');
    return false;
  }
}
