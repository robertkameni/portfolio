// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, contextMock, getAIClientMock } = vi.hoisted(() => ({
  prismaMock: {
    aiDecision: { create: vi.fn() },
    aiLog: { create: vi.fn() },
  },
  contextMock: {
    getSessionHistoryAsText: vi.fn(),
  },
  getAIClientMock: vi.fn(),
}));

vi.mock('../../db/client', () => ({ prisma: prismaMock }));
vi.mock('../context.engine', () => ({ contextEngine: contextMock }));
vi.mock('../deepseek.client', async () => {
  const actual = await vi.importActual<typeof import('../deepseek.client')>('../deepseek.client');
  return {
    ...actual,
    getAIClient: getAIClientMock,
    withAIRetry: <T>(operation: () => Promise<T>) => operation(),
  };
});

import { analyzeVisitorSession, visitorAgent } from './visitor.agent';

describe('analyzeVisitorSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.aiDecision.create.mockResolvedValue({});
    prismaMock.aiLog.create.mockResolvedValue({});
  });

  it('returns fallback when session has no activity', async () => {
    contextMock.getSessionHistoryAsText.mockResolvedValue('No activity recorded');
    getAIClientMock.mockReturnValue({
      getGenerativeModel: () => ({
        generateContent: vi.fn(),
      }),
    });

    const result = await analyzeVisitorSession('session-1');
    expect(result.visitorType).toBe('other');
    expect(result.confidenceScore).toBe(0.3);
    expect(visitorAgent.analyze).toBe(analyzeVisitorSession);
  });

  it('returns AI classification when payload is valid', async () => {
    contextMock.getSessionHistoryAsText.mockResolvedValue('viewed projects and skills');
    getAIClientMock.mockReturnValue({
      getGenerativeModel: () => ({
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () =>
              JSON.stringify({
                visitorType: 'developer',
                interests: ['Angular'],
                confidenceScore: 0.9,
                summary: 'Looked at tech details',
                reasoning: 'Deep project focus',
              }),
          },
        }),
      }),
    });

    const result = await analyzeVisitorSession('session-2');
    expect(result.visitorType).toBe('developer');
    expect(prismaMock.aiDecision.create).toHaveBeenCalled();
    expect(prismaMock.aiLog.create).toHaveBeenCalled();
  });

  it('falls back when AI throws a quota error', async () => {
    contextMock.getSessionHistoryAsText.mockResolvedValue('viewed about page');
    getAIClientMock.mockReturnValue({
      getGenerativeModel: () => ({
        generateContent: vi.fn().mockRejectedValue(Object.assign(new Error('quota'), { status: 429 })),
      }),
    });

    const result = await analyzeVisitorSession('session-3');
    expect(result.visitorType).toBe('other');
    expect(prismaMock.aiLog.create).toHaveBeenCalled();
  });
});
