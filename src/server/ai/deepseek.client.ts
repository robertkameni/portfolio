type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

type DeepSeekResponseFormat = {
  type: 'json_object';
};

type UniversalModelOptions = {
  model: string;
  systemInstruction?: string;
  generationConfig?: {
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
};

type ChatHistoryPart = { text?: unknown };
type ChatHistoryItem = {
  role?: unknown;
  parts?: unknown;
};

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type StreamChunk = { text: () => string };
type StreamResponse = { stream: AsyncIterable<StreamChunk> };

type StreamingChat = {
  sendMessageStream: (message: string) => Promise<StreamResponse>;
};

type UniversalGenerativeModel = {
  startChat: (options: {
    history?: unknown[];
    generationConfig?: {
      maxOutputTokens?: number;
    };
  }) => StreamingChat;
  generateContent: (prompt: string) => Promise<{ response: { text: () => string } }>;
};

export type AIModelClient = {
  getGenerativeModel: (options: UniversalModelOptions) => UniversalGenerativeModel;
};

let cachedClient: AIModelClient | undefined;

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 4,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
};

const DEFAULT_DEEPSEEK_API_BASE = 'https://api.deepseek.com';
const DEFAULT_DEEPSEEK_CHAT_PATH = '/chat/completions';

const trimmedChatModelEnv = process.env['DEEPSEEK_CHAT_MODEL']?.trim();
const trimmedVisitorModelEnv = process.env['DEEPSEEK_VISITOR_MODEL']?.trim();

/** Chat streaming + portfolio twin (OpenAI-compatible id sent to DeepSeek). */
export const DEFAULT_DEEPSEEK_CHAT_MODEL = trimmedChatModelEnv || 'deepseek-chat';

/** Visitor classification JSON call (defaults to chat model). */
export const DEFAULT_DEEPSEEK_VISITOR_MODEL = trimmedVisitorModelEnv || DEFAULT_DEEPSEEK_CHAT_MODEL;

function readPositiveIntFromEnv(name: string, fallback: number, minValue = 1): number {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < minValue) {
    return fallback;
  }

  return parsed;
}

function resolveRetryOptions(options: RetryOptions): Required<RetryOptions> {
  const envDefaults: Required<RetryOptions> = {
    maxRetries: readPositiveIntFromEnv('AI_RETRY_MAX_RETRIES', DEFAULT_RETRY_OPTIONS.maxRetries, 0),
    baseDelayMs: readPositiveIntFromEnv('AI_RETRY_BASE_DELAY_MS', DEFAULT_RETRY_OPTIONS.baseDelayMs),
    maxDelayMs: readPositiveIntFromEnv('AI_RETRY_MAX_DELAY_MS', DEFAULT_RETRY_OPTIONS.maxDelayMs),
  };

  return {
    maxRetries: options.maxRetries ?? envDefaults.maxRetries,
    baseDelayMs: options.baseDelayMs ?? envDefaults.baseDelayMs,
    maxDelayMs: options.maxDelayMs ?? envDefaults.maxDelayMs,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readStatusCode(error: unknown): number | null {
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

function isRetryableAIRequestError(error: unknown): boolean {
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

function resolveApiKey(): string {
  const apiKey = process.env['DEEPSEEK_API_KEY'] ?? process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set (GEMINI_API_KEY is accepted only as a legacy alias). Check your .env file.');
  }
  return apiKey;
}

function resolveModelName(requestedModel: string): string {
  const model = requestedModel?.trim() ?? '';
  return model || DEFAULT_DEEPSEEK_CHAT_MODEL;
}

function normalizeChatHistoryItem(item: ChatHistoryItem): ChatMessage | null {
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

function toMessages(history: unknown[] = []): ChatMessage[] {
  const messages = history
    .map((item) => normalizeChatHistoryItem(item as ChatHistoryItem))
    .filter((item): item is ChatMessage => item !== null);

  return messages.map((entry) => ({
    role: entry.role,
    content: entry.content,
  }));
}

async function requestDeepSeekCompletion(promptMessages: ChatMessage[], options: {
  stream: boolean;
  model: string;
  maxOutputTokens?: number;
  responseMimeType?: string;
}): Promise<Response> {
  const apiKey = resolveApiKey();
  const endpoint = process.env['DEEPSEEK_API_BASE_URL'] ?? `${DEFAULT_DEEPSEEK_API_BASE}${DEFAULT_DEEPSEEK_CHAT_PATH}`;
  const payload: {
    model: string;
    messages: ChatMessage[];
    stream: boolean;
    response_format?: DeepSeekResponseFormat;
    max_tokens?: number;
  } = {
    model: options.model,
    messages: promptMessages,
    stream: options.stream,
    max_tokens: options.maxOutputTokens,
  };

  if (options.responseMimeType === 'application/json') {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`DeepSeek request failed: ${response.status} ${response.statusText} ${text}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response;
}

async function createStreamingResponse(response: Response): Promise<StreamResponse> {
  if (!response.body) {
    throw new Error('DeepSeek response did not include a stream body.');
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();

  async function* stream(): AsyncGenerator<StreamChunk> {
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

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) {
            continue;
          }

          const data = trimmed.slice(6);
          if (!data || data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              yield { text: () => delta };
            }
          } catch (error) {
            console.error('[DeepSeek Stream] Failed to parse SSE payload.', { data, error });
          }
        }
      }
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              yield { text: () => delta };
            }
          } catch (error) {
            console.error('[DeepSeek Stream] Failed to parse SSE payload.', { data, error });
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  return { stream: stream() };
}

async function runDeepSeekCompletion(promptMessages: ChatMessage[], options: {
  model: string;
  maxOutputTokens?: number;
  responseMimeType?: string;
}): Promise<{ response: { text: () => string } }> {
  const response = await requestDeepSeekCompletion(promptMessages, {
    stream: false,
    model: options.model,
    maxOutputTokens: options.maxOutputTokens,
    responseMimeType: options.responseMimeType,
  });
  const payload = await response.json();
  const responseText = payload?.choices?.[0]?.message?.content ?? '';
  return {
    response: {
      text: () => String(responseText),
    },
  };
}

function computeBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const expDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 250);
  return expDelay + jitter;
}

export function getAIClient(): AIModelClient {
  if (!cachedClient) {
    resolveApiKey();

    cachedClient = {
      getGenerativeModel: (options) => {
        const modelName = resolveModelName(options.model);
        const systemInstruction = options.systemInstruction?.trim() ?? '';

        return {
          startChat: (chatOptions) => {
            const baseMessages = toMessages(chatOptions.history);
            if (systemInstruction.length > 0) {
              baseMessages.unshift({ role: 'system', content: systemInstruction });
            }

            const maxOutputTokens =
              chatOptions?.generationConfig?.maxOutputTokens ?? options.generationConfig?.maxOutputTokens;

            return {
              sendMessageStream: async (message: string) => {
                const response = await requestDeepSeekCompletion([...baseMessages, { role: 'user', content: message }], {
                  stream: true,
                  model: modelName,
                  maxOutputTokens,
                  responseMimeType: options.generationConfig?.responseMimeType,
                });
                const streamed = await createStreamingResponse(response);
                return streamed;
              },
            };
          },
          generateContent: async (prompt) => {
            const baseMessages = toMessages([]);
            if (systemInstruction.length > 0) {
              baseMessages.push({ role: 'system', content: systemInstruction });
            }
            baseMessages.push({ role: 'user', content: prompt });

            return runDeepSeekCompletion(baseMessages, {
              model: modelName,
              maxOutputTokens: options.generationConfig?.maxOutputTokens,
              responseMimeType: options.generationConfig?.responseMimeType,
            });
          },
        };
      },
    };
  }
  return cachedClient;
}

export async function withAIRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = resolveRetryOptions(options);

  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const canRetry = attempt < maxRetries && isRetryableAIRequestError(error);
      if (!canRetry) {
        throw error;
      }

      const delayMs = computeBackoffDelay(attempt, baseDelayMs, maxDelayMs);
      console.warn(`[AI Retry] attempt=${attempt + 1}/${maxRetries} delayMs=${delayMs}`);
      await sleep(delayMs);
    }
  }
}
