// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { H3Event } from 'h3';
import { parseAndValidatePostChatRequest } from '../api/ai/chat/stream-request-utils';

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3');
  return {
    ...actual,
    readBody: vi.fn(),
  };
});

vi.mock('../api/ai/chat/stream-utils', () => ({
  writeSseError: vi.fn(),
}));

import { readBody } from 'h3';
import { writeSseError } from '../api/ai/chat/stream-utils';

function makeEvent(method: string): H3Event {
  return {
    node: {
      req: { method },
      res: {
        writableEnded: false,
        setHeader: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
      },
    },
  } as unknown as H3Event;
}

describe('parseAndValidatePostChatRequest', () => {
  it('rejects non-POST methods', async () => {
    const log = vi.fn();
    const result = await parseAndValidatePostChatRequest(makeEvent('GET'), 'req-1', log);
    expect(result).toBeNull();
    expect(log).toHaveBeenCalledWith('req-1', undefined, '[method-error]', 'error', expect.any(Error));
    expect(writeSseError).toHaveBeenCalled();
  });

  it('rejects invalid bodies and invalid chat input', async () => {
    const log = vi.fn();
    vi.mocked(readBody).mockRejectedValueOnce(new Error('bad json'));
    expect(await parseAndValidatePostChatRequest(makeEvent('POST'), 'req-2', log)).toBeNull();

    vi.mocked(readBody).mockResolvedValueOnce({ message: '', history: [] });
    expect(await parseAndValidatePostChatRequest(makeEvent('POST'), 'req-3', log)).toBeNull();
  });

  it('returns a validated chat request', async () => {
    const log = vi.fn();
    vi.mocked(readBody).mockResolvedValueOnce({
      message: 'Hello there',
      history: [{ role: 'user', parts: [{ text: 'prior' }] }],
      sessionId: 's1',
    });

    const result = await parseAndValidatePostChatRequest(makeEvent('POST'), 'req-4', log);
    expect(result).toEqual({
      message: 'Hello there',
      history: [{ role: 'user', parts: [{ text: 'prior' }] }],
      sessionId: 's1',
    });
  });
});
