export type ChatHistoryPart = { text?: unknown };
export type ChatHistoryItem = {
  role?: unknown;
  parts?: unknown;
};

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

export type StreamChunk = { text: () => string };

export function readStatusCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const statusFromError = (error as { status?: unknown }).status;
  if (typeof statusFromError === 'number') {
    return statusFromError;
  }

  const maybeResponse = (error as { response?: { status?: unknown } }).response;
  if (maybeResponse && typeof maybeResponse.status === 'number') {
    return maybeResponse.status;
  }

  return null;
}

export function isRetryableAIRequestError(error: unknown): boolean {
  const status = readStatusCode(error);
  if (status === 429) {
    return false;
  }

  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('429') || message.includes('quota') || message.includes('rate limit') || message.includes('too many requests')) {
    return false;
  }

  return message.includes('timeout') || message.includes('temporarily unavailable') || message.includes('econnreset');
}

export function isQuotaError(error: unknown): boolean {
  const status = readStatusCode(error);
  if (status === 429) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('quota') || message.includes('too many requests') || message.includes('rate limit');
}

export function isDeepSeekThinkingEnabled(): boolean {
  const raw = process.env['DEEPSEEK_THINKING_ENABLED']?.trim().toLowerCase();
  return raw === 'true' || raw === '1';
}

export function normalizeChatHistoryItem(item: ChatHistoryItem): ChatMessage | null {
  const role = item?.role === 'model' ? 'assistant' : item?.role === 'user' ? 'user' : null;
  if (role === null) {
    return null;
  }

  const parts = Array.isArray(item.parts) ? item.parts : [];
  const content = parts
    .map((part) => (typeof part === 'object' && part && 'text' in (part as ChatHistoryPart) ? String((part as ChatHistoryPart).text ?? '') : ''))
    .filter((text) => text.length > 0)
    .join('\n');

  return content.length > 0 ? { role, content } : null;
}

export type CompletionMessage = {
  content: string;
  tool_calls: ToolCall[];
};

export function extractCompletionMessage(payload: unknown): CompletionMessage {
  const message = (payload as { choices?: Array<{ message?: Record<string, unknown> }> })?.choices?.[0]?.message;
  if (!message) {
    return { content: '', tool_calls: [] };
  }

  const content = typeof message['content'] === 'string' ? message['content'] : '';
  const toolCallsRaw = message['tool_calls'];
  const tool_calls: ToolCall[] = Array.isArray(toolCallsRaw)
    ? toolCallsRaw
        .map((call) => {
          if (!call || typeof call !== 'object') {
            return null;
          }
          const record = call as Record<string, unknown>;
          const fn = record['function'];
          if (!record['id'] || typeof record['id'] !== 'string' || !fn || typeof fn !== 'object') {
            return null;
          }
          const fnRecord = fn as Record<string, unknown>;
          if (typeof fnRecord['name'] !== 'string') {
            return null;
          }
          return {
            id: record['id'],
            type: 'function' as const,
            function: {
              name: fnRecord['name'],
              arguments: typeof fnRecord['arguments'] === 'string' ? fnRecord['arguments'] : '{}',
            },
          };
        })
        .filter((call): call is ToolCall => call !== null)
    : [];

  if (content.length > 0) {
    return { content, tool_calls };
  }

  if (isDeepSeekThinkingEnabled() && typeof message['reasoning_content'] === 'string') {
    return { content: message['reasoning_content'], tool_calls };
  }

  return { content: '', tool_calls };
}

export function textFromCompletionDelta(delta: unknown): string {
  if (!delta || typeof delta !== 'object') {
    return '';
  }

  const record = delta as Record<string, unknown>;
  const content = record['content'];
  if (typeof content === 'string' && content.length > 0) {
    return content;
  }

  if (isDeepSeekThinkingEnabled()) {
    const reasoning = record['reasoning_content'];
    if (typeof reasoning === 'string' && reasoning.length > 0) {
      return reasoning;
    }
  }

  return '';
}

export function streamChunkFromSseData(data: string): StreamChunk | null {
  try {
    const parsed = JSON.parse(data);
    const text = textFromCompletionDelta(parsed?.choices?.[0]?.delta);
    return text.length > 0 ? { text: () => text } : null;
  } catch (error) {
    console.error('[DeepSeek Stream] Failed to parse SSE payload.', { data, error });
    return null;
  }
}

export function* streamChunksFromSseLines(lines: Iterable<string>): Generator<StreamChunk> {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data: ')) {
      continue;
    }

    const data = trimmed.slice(6).trim();
    if (!data || data === '[DONE]') {
      continue;
    }

    const chunk = streamChunkFromSseData(data);
    if (chunk) {
      yield chunk;
    }
  }
}

export async function* streamDeepSeekCompletionChunks(response: Response): AsyncGenerator<StreamChunk> {
  if (!response.body) {
    throw new Error('DeepSeek response did not include a stream body.');
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();

  let buffer = '';

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }

      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      yield* streamChunksFromSseLines(lines);
    }

    if (buffer.length > 0) {
      yield* streamChunksFromSseLines([buffer]);
    }
  } finally {
    reader.releaseLock();
  }
}

export function extractCompletionResponseText(payload: unknown): string {
  return extractCompletionMessage(payload).content;
}
