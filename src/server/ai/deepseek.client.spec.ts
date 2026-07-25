// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAIClient,
  requestDeepSeekCompletion,
  resetAIClientCacheForTests,
  runDeepSeekCompletion,
  withAIRetry,
} from './deepseek.client';

describe('deepseek.client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env['DEEPSEEK_API_KEY'] = 'test-key';
    process.env['DEEPSEEK_THINKING_ENABLED'] = undefined;
    resetAIClientCacheForTests();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetAIClientCacheForTests();
    vi.restoreAllMocks();
  });

  it('requestDeepSeekCompletion posts and throws on non-ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'ERR',
      text: async () => 'boom',
    }) as unknown as typeof fetch;

    await expect(
      requestDeepSeekCompletion([{ role: 'user', content: 'hi' }], {
        stream: false,
        model: 'deepseek-chat',
        responseMimeType: 'application/json',
      }),
    ).rejects.toMatchObject({ status: 500 });

    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it('runDeepSeekCompletion returns response text', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'answer' } }] }),
    }) as unknown as typeof fetch;

    const result = await runDeepSeekCompletion([{ role: 'user', content: 'q' }], { model: 'deepseek-chat' });
    expect(result.response.text()).toBe('answer');
  });

  it('getAIClient startChat and generateContent use fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'gen' } }] }),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: 's' } }] })}\n`));
          controller.close();
        },
      }),
    }) as unknown as typeof fetch;

    const client = getAIClient();
    const model = client.getGenerativeModel({ model: 'deepseek-chat', systemInstruction: 'sys' });
    const chat = model.startChat({
      history: [{ role: 'user', parts: [{ text: 'hello' }] }],
      generationConfig: { maxOutputTokens: 10 },
    });
    expect(chat.sendMessageStream).toBeTypeOf('function');

    const generated = await model.generateContent('prompt');
    expect(generated.response.text()).toBe('gen');
  });

  it('withAIRetry retries retryable errors then succeeds', async () => {
    let attempts = 0;
    const value = await withAIRetry(
      async () => {
        attempts += 1;
        if (attempts < 2) {
          throw Object.assign(new Error('temporary'), { status: 503 });
        }
        return 'ok';
      },
      { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 1 },
    );

    expect(value).toBe('ok');
    expect(attempts).toBe(2);
  });

  it('withAIRetry does not retry quota errors', async () => {
    await expect(
      withAIRetry(async () => {
        throw Object.assign(new Error('quota'), { status: 429 });
      }, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 1 }),
    ).rejects.toThrow('quota');
  });
});
