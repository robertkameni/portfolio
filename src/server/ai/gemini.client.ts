import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI;

type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 4,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
};

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
    maxRetries: readPositiveIntFromEnv('GEMINI_RETRY_MAX_RETRIES', DEFAULT_RETRY_OPTIONS.maxRetries, 0),
    baseDelayMs: readPositiveIntFromEnv('GEMINI_RETRY_BASE_DELAY_MS', DEFAULT_RETRY_OPTIONS.baseDelayMs),
    maxDelayMs: readPositiveIntFromEnv('GEMINI_RETRY_MAX_DELAY_MS', DEFAULT_RETRY_OPTIONS.maxDelayMs),
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

function isRetryableGeminiError(error: unknown): boolean {
  const status = readStatusCode(error);
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return message.includes('429') || message.includes('rate') || message.includes('quota') || message.includes('timeout');
}

function computeBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const expDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 250);
  return expDelay + jitter;
}

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    // Access the environment variable directly to avoid Nitro context issues
    const apiKey = process.env['GEMINI_API_KEY'];

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Please check your .env file.');
    }

    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function withGeminiRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = resolveRetryOptions(options);

  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const canRetry = attempt < maxRetries && isRetryableGeminiError(error);
      if (!canRetry) {
        throw error;
      }

      const delayMs = computeBackoffDelay(attempt, baseDelayMs, maxDelayMs);
      console.warn(`[Gemini Retry] attempt=${attempt + 1}/${maxRetries} delayMs=${delayMs}`);
      await sleep(delayMs);
    }
  }
}

