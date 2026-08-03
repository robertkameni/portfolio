import {
  type ChatHistoryItem,
  type ChatMessage,
  type CompletionMessage,
  type StreamChunk,
  extractCompletionMessage,
  isDeepSeekThinkingEnabled,
  isRetryableAIRequestError,
  normalizeChatHistoryItem,
  streamDeepSeekCompletionChunks,
} from './deepseek.helpers';
import { readPositiveIntFromEnv } from '../utils/env.util';
import { sleep } from '../utils/async.util';

export { isRetryableAIRequestError, readStatusCode } from './deepseek.helpers';

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

const DEEPSEEK_CHAT_ENDPOINT = 'https://api.deepseek.com/chat/completions';

/** Ensures optional env override cannot point fetch at an unexpected host. */
function assertDeepSeekEndpointAllowed(): void {
  const configured = process.env['DEEPSEEK_API_BASE_URL']?.trim();
  if (!configured) {
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error('DEEPSEEK_API_BASE_URL is not a valid URL.');
  }

  if (parsed.toString() !== DEEPSEEK_CHAT_ENDPOINT) {
    throw new Error(`DEEPSEEK_API_BASE_URL must be exactly ${DEEPSEEK_CHAT_ENDPOINT}.`);
  }
}

const trimmedChatModelEnv = process.env['DEEPSEEK_CHAT_MODEL']?.trim();
const trimmedVisitorModelEnv = process.env['DEEPSEEK_VISITOR_MODEL']?.trim();

/** Chat streaming + portfolio twin (OpenAI-compatible id sent to DeepSeek). */
export const DEFAULT_DEEPSEEK_CHAT_MODEL = trimmedChatModelEnv || 'deepseek-chat';

/** Visitor classification JSON call (defaults to chat model). */
export const DEFAULT_DEEPSEEK_VISITOR_MODEL = trimmedVisitorModelEnv || DEFAULT_DEEPSEEK_CHAT_MODEL;

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

function toMessages(history: unknown[] = []): ChatMessage[] {
  const messages = history.map((item) => normalizeChatHistoryItem(item as ChatHistoryItem)).filter((item): item is ChatMessage => item !== null);

  return messages.map((entry) => ({
    role: entry.role,
    content: entry.content,
    ...(entry.tool_calls ? { tool_calls: entry.tool_calls } : {}),
    ...(entry.tool_call_id ? { tool_call_id: entry.tool_call_id } : {}),
  }));
}

function resolveDeepSeekFetchTimeoutMs(): number {
  const raw = process.env['DEEPSEEK_FETCH_TIMEOUT_MS']?.trim();
  if (!raw) {
    return 120_000;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 10_000) {
    return 120_000;
  }
  return parsed;
}

export async function requestDeepSeekCompletion(
  promptMessages: ChatMessage[],
  options: {
    stream: boolean;
    model: string;
    maxOutputTokens?: number;
    responseMimeType?: string;
    tools?: readonly unknown[];
  },
): Promise<Response> {
  const apiKey = resolveApiKey();
  assertDeepSeekEndpointAllowed();
  const payload: {
    model: string;
    messages: ChatMessage[];
    stream: boolean;
    response_format?: DeepSeekResponseFormat;
    max_tokens?: number;
    thinking?: { type: 'disabled' | 'enabled' };
    tools?: readonly unknown[];
  } = {
    model: options.model,
    messages: promptMessages,
    stream: options.stream,
    max_tokens: options.maxOutputTokens,
  };

  if (!isDeepSeekThinkingEnabled()) {
    payload.thinking = { type: 'disabled' };
  }

  if (options.responseMimeType === 'application/json') {
    payload.response_format = { type: 'json_object' };
  }

  if (options.tools && options.tools.length > 0) {
    payload.tools = options.tools;
  }

  const timeoutMs = resolveDeepSeekFetchTimeoutMs();
  const response = await fetch(DEEPSEEK_CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`DeepSeek request failed: ${response.status} ${response.statusText} ${text}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response;
}

type StreamCompletionOptions = {
  model: string;
  maxOutputTokens?: number;
  responseMimeType?: string;
};

function createLazyStreamResponse(messages: ChatMessage[], streamOptions: StreamCompletionOptions): StreamResponse {
  async function* stream(): AsyncGenerator<StreamChunk> {
    const response = await requestDeepSeekCompletion(messages, {
      stream: true,
      model: streamOptions.model,
      maxOutputTokens: streamOptions.maxOutputTokens,
      responseMimeType: streamOptions.responseMimeType,
    });
    yield* streamDeepSeekCompletionChunks(response);
  }

  return { stream: stream() };
}

export async function runDeepSeekCompletion(
  promptMessages: ChatMessage[],
  options: {
    model: string;
    maxOutputTokens?: number;
    responseMimeType?: string;
    tools?: readonly unknown[];
  },
): Promise<{ response: { text: () => string; message: () => CompletionMessage } }> {
  const response = await requestDeepSeekCompletion(promptMessages, {
    stream: false,
    model: options.model,
    maxOutputTokens: options.maxOutputTokens,
    responseMimeType: options.responseMimeType,
    tools: options.tools,
  });
  const payload = await response.json();
  const completionMessage = extractCompletionMessage(payload);
  return {
    response: {
      text: () => String(completionMessage.content),
      message: () => completionMessage,
    },
  };
}

function computeBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const expDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 250);
  return expDelay + jitter;
}

export function resetAIClientCacheForTests(): void {
  cachedClient = undefined;
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

            const maxOutputTokens = chatOptions?.generationConfig?.maxOutputTokens ?? options.generationConfig?.maxOutputTokens;

            return {
              sendMessageStream: (message: string) =>
                Promise.resolve(
                  createLazyStreamResponse([...baseMessages, { role: 'user', content: message }], {
                    model: modelName,
                    maxOutputTokens,
                    responseMimeType: options.generationConfig?.responseMimeType,
                  }),
                ),
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
