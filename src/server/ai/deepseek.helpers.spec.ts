// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  extractCompletionResponseText,
  isDeepSeekThinkingEnabled,
  isQuotaError,
  isRetryableAIRequestError,
  normalizeChatHistoryItem,
  readStatusCode,
  streamChunkFromSseData,
  streamChunksFromSseLines,
  streamDeepSeekCompletionChunks,
  textFromCompletionDelta,
} from './deepseek.helpers';

describe('deepseek.helpers', () => {
  afterEach(() => {
    process.env['DEEPSEEK_THINKING_ENABLED'] = undefined;
    vi.restoreAllMocks();
  });

  describe('readStatusCode', () => {
    it('reads status from error and response shapes', () => {
      expect(readStatusCode(null)).toBeNull();
      expect(readStatusCode('x')).toBeNull();
      expect(readStatusCode({ status: 503 })).toBe(503);
      expect(readStatusCode({ response: { status: 429 } })).toBe(429);
      expect(readStatusCode({ status: 'nope', response: {} })).toBeNull();
    });
  });

  describe('isRetryableAIRequestError', () => {
    it('classifies retryable and non-retryable errors', () => {
      expect(isRetryableAIRequestError({ status: 429 })).toBe(false);
      expect(isRetryableAIRequestError({ status: 500 })).toBe(true);
      expect(isRetryableAIRequestError({ status: 502 })).toBe(true);
      expect(isRetryableAIRequestError({ status: 503 })).toBe(true);
      expect(isRetryableAIRequestError({ status: 504 })).toBe(true);
      expect(isRetryableAIRequestError(new Error('quota exceeded'))).toBe(false);
      expect(isRetryableAIRequestError(new Error('rate limit'))).toBe(false);
      expect(isRetryableAIRequestError(new Error('too many requests'))).toBe(false);
      expect(isRetryableAIRequestError(new Error('429 boom'))).toBe(false);
      expect(isRetryableAIRequestError(new Error('timeout waiting'))).toBe(true);
      expect(isRetryableAIRequestError(new Error('temporarily unavailable'))).toBe(true);
      expect(isRetryableAIRequestError(new Error('ECONNRESET'))).toBe(true);
      expect(isRetryableAIRequestError(new Error('other'))).toBe(false);
      expect(isRetryableAIRequestError({ status: 400 })).toBe(false);
    });
  });

  describe('isQuotaError', () => {
    it('detects quota and rate-limit errors', () => {
      expect(isQuotaError({ status: 429 })).toBe(true);
      expect(isQuotaError(new Error('quota'))).toBe(true);
      expect(isQuotaError(new Error('too many requests'))).toBe(true);
      expect(isQuotaError(new Error('rate limit'))).toBe(true);
      expect(isQuotaError('quota text')).toBe(true);
      expect(isQuotaError(new Error('unrelated'))).toBe(false);
    });
  });

  describe('normalizeChatHistoryItem', () => {
    it('normalizes roles and parts', () => {
      expect(normalizeChatHistoryItem({ role: 'system', parts: [{ text: 'x' }] })).toBeNull();
      expect(normalizeChatHistoryItem({ role: 'user', parts: 'bad' })).toBeNull();
      expect(normalizeChatHistoryItem({ role: 'user', parts: [{ text: '' }, null, { text: 'hi' }] })).toEqual({
        role: 'user',
        content: 'hi',
      });
      expect(
        normalizeChatHistoryItem({
          role: 'model',
          parts: [{ text: 'a' }, { text: 'b' }, { noText: true }, 'skip'],
        }),
      ).toEqual({ role: 'assistant', content: 'a\nb' });
    });
  });

  describe('textFromCompletionDelta / thinking mode', () => {
    it('reads content and optional reasoning', () => {
      expect(textFromCompletionDelta(null)).toBe('');
      expect(textFromCompletionDelta({ content: 'hello' })).toBe('hello');
      expect(textFromCompletionDelta({ content: '', reasoning_content: 'think' })).toBe('');

      process.env['DEEPSEEK_THINKING_ENABLED'] = 'true';
      expect(isDeepSeekThinkingEnabled()).toBe(true);
      expect(textFromCompletionDelta({ reasoning_content: 'think' })).toBe('think');
      expect(textFromCompletionDelta({ content: 1, reasoning_content: '' })).toBe('');
    });
  });

  describe('SSE helpers', () => {
    it('parses SSE data lines and skips noise', () => {
      expect(streamChunkFromSseData('not-json')).toBeNull();
      expect(streamChunkFromSseData(JSON.stringify({ choices: [{ delta: {} }] }))).toBeNull();

      const chunk = streamChunkFromSseData(JSON.stringify({ choices: [{ delta: { content: 'token' } }] }));
      expect(chunk?.text()).toBe('token');

      const lines = [
        'ignore',
        'data: ',
        'data: [DONE]',
        `data: ${JSON.stringify({ choices: [{ delta: { content: 'a' } }] })}`,
        `data: ${JSON.stringify({ choices: [{ delta: { content: 'b' } }] })}`,
      ];
      expect([...streamChunksFromSseLines(lines)].map((c) => c.text())).toEqual(['a', 'b']);
    });

    it('streams chunks from a Response body', async () => {
      const encoder = new TextEncoder();
      const payload = `data: ${JSON.stringify({ choices: [{ delta: { content: 'hi' } }] })}\n` + `data: ${JSON.stringify({ choices: [{ delta: { content: '!' } }] })}\n`;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(payload.slice(0, 20)));
          controller.enqueue(encoder.encode(payload.slice(20)));
          controller.close();
        },
      });

      const texts: string[] = [];
      for await (const chunk of streamDeepSeekCompletionChunks(new Response(stream))) {
        texts.push(chunk.text());
      }
      expect(texts.join('')).toBe('hi!');

      await expect(async () => {
        for await (const _ of streamDeepSeekCompletionChunks(new Response(null))) {
          // empty
        }
      }).rejects.toThrow('stream body');
    });
  });

  describe('extractCompletionResponseText', () => {
    it('prefers content and falls back to reasoning when enabled', () => {
      expect(extractCompletionResponseText({})).toBe('');
      expect(extractCompletionResponseText({ choices: [{ message: { content: 'ok' } }] })).toBe('ok');

      process.env['DEEPSEEK_THINKING_ENABLED'] = '1';
      expect(extractCompletionResponseText({ choices: [{ message: { reasoning_content: 'r' } }] })).toBe('r');
    });
  });
});
