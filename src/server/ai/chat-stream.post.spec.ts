// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { H3Event } from 'h3';

const {
  parseMock,
  enforceMock,
  loadContextMock,
  resolveVisitorMock,
  createModelMock,
  streamSafeMock,
  getAIClientMock,
} = vi.hoisted(() => ({
  parseMock: vi.fn(),
  enforceMock: vi.fn(),
  loadContextMock: vi.fn(),
  resolveVisitorMock: vi.fn(),
  createModelMock: vi.fn(),
  streamSafeMock: vi.fn(),
  getAIClientMock: vi.fn(),
}));

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3');
  return {
    ...actual,
    setHeader: vi.fn(),
    getRequestIP: vi.fn(() => '127.0.0.1'),
    defineEventHandler: (handler: unknown) => handler,
  };
});

vi.mock('./deepseek.client', () => ({
  DEFAULT_DEEPSEEK_CHAT_MODEL: 'deepseek-chat',
  getAIClient: getAIClientMock,
}));

vi.mock('./chat-security', () => ({
  generateRequestId: () => 'req-test',
  logChatInteraction: vi.fn(),
}));

vi.mock('../api/ai/chat/prompt-helpers', () => ({
  buildSystemInstruction: vi.fn(() => 'system'),
}));

vi.mock('../api/ai/chat/stream-request-utils', () => ({
  parseAndValidatePostChatRequest: parseMock,
}));

vi.mock('../api/ai/chat/stream-utils', () => ({
  applySseHeaders: vi.fn(),
  createChatModelSafe: createModelMock,
  streamChatResponseSafe: streamSafeMock,
  writeSseError: vi.fn(),
}));

vi.mock('../api/ai/chat/visitor-context', () => ({
  resolveVisitorContextString: resolveVisitorMock,
}));

vi.mock('../api/ai/chat/chat-stream-shared', () => ({
  enforceChatRateLimits: enforceMock,
  loadChatPromptContext: loadContextMock,
}));

import { handleChatStreamPost } from '../api/ai/chat/stream.post';
import streamPostDefault from '../api/ai/chat/stream.post';

function makeEvent(): H3Event {
  return {
    node: {
      req: { method: 'POST' },
      res: {
        writableEnded: false,
        setHeader: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
      },
    },
  } as unknown as H3Event;
}

describe('handleChatStreamPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns early when request parsing fails', async () => {
    parseMock.mockResolvedValue(null);
    await handleChatStreamPost(makeEvent());
    expect(enforceMock).not.toHaveBeenCalled();
  });

  it('streams a successful chat response', async () => {
    parseMock.mockResolvedValue({
      message: 'Hello',
      history: [],
      sessionId: 's1',
    });
    enforceMock.mockResolvedValue(true);
    loadContextMock.mockResolvedValue({
      baseProfile: { name: 'Test' },
      projectSummary: '',
      responseMode: 'default',
      intentHint: '',
    });
    resolveVisitorMock.mockResolvedValue('');
    createModelMock.mockImplementation((_event, factory) => factory());
    getAIClientMock.mockReturnValue({
      getGenerativeModel: () => ({
        startChat: () => ({
          sendMessageStream: vi.fn(),
        }),
      }),
    });
    streamSafeMock.mockResolvedValue(true);

    await handleChatStreamPost(makeEvent());
    expect(streamSafeMock).toHaveBeenCalled();
    expect(streamPostDefault).toBeTypeOf('function');
    await streamPostDefault(makeEvent());
  });

  it('stops when rate limited', async () => {
    parseMock.mockResolvedValue({ message: 'Hello', history: [], sessionId: 's1' });
    enforceMock.mockResolvedValue(false);

    await handleChatStreamPost(makeEvent());
    expect(loadContextMock).not.toHaveBeenCalled();
  });
});
