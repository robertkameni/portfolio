// @vitest-environment node
import { describe, expect, it } from 'vitest';
import notFoundStatusMiddleware from './not-found-status';
import { NOT_FOUND_FLAG } from '../../app/shared/routing/not-found-flag';

type Call = { status: number; reason?: string; headers?: unknown };

function makeEvent() {
  const calls: Call[] = [];
  const res = {
    writeHead(status: number, a?: unknown, b?: unknown) {
      const reason = typeof a === 'string' ? a : undefined;
      const headers = typeof a === 'string' ? b : a;
      calls.push({ status, reason, headers });
      return res;
    },
  };
  return { event: { node: { res } } as never, res, calls };
}

describe('not-found status middleware', () => {
  it('leaves a normal response untouched', async () => {
    const { event, res, calls } = makeEvent();
    await notFoundStatusMiddleware(event);

    res.writeHead(200, 'OK', { 'content-type': 'text/html' });

    expect(calls).toEqual([{ status: 200, reason: 'OK', headers: { 'content-type': 'text/html' } }]);
  });

  it('forces 404 once the page has marked the response', async () => {
    const { event, res, calls } = makeEvent();
    await notFoundStatusMiddleware(event);

    // What the not-found component does during SSR.
    (res as unknown as Record<string, boolean>)[NOT_FOUND_FLAG] = true;

    res.writeHead(200, 'OK', { 'content-type': 'text/html' });

    expect(calls[0]?.status).toBe(404);
    // Headers survive: only the status is replaced.
    expect(calls[0]?.headers).toEqual({ 'content-type': 'text/html' });
  });

  it('keeps a reason phrase and headers that the caller passed', async () => {
    const { event, res, calls } = makeEvent();
    await notFoundStatusMiddleware(event);
    (res as unknown as Record<string, boolean>)[NOT_FOUND_FLAG] = true;

    res.writeHead(200, 'OK', { 'x-test': '1' });

    expect(calls[0]).toEqual({ status: 404, reason: 'OK', headers: { 'x-test': '1' } });
  });

  it('handles the headers-only overload', async () => {
    const { event, res, calls } = makeEvent();
    await notFoundStatusMiddleware(event);
    (res as unknown as Record<string, boolean>)[NOT_FOUND_FLAG] = true;

    res.writeHead(200, { 'x-test': '1' });

    expect(calls[0]).toEqual({ status: 404, reason: 'Not Found', headers: { 'x-test': '1' } });
  });

  it('is idempotent, so a second request does not wrap twice', async () => {
    const { event, res, calls } = makeEvent();
    await notFoundStatusMiddleware(event);
    await notFoundStatusMiddleware(event);

    res.writeHead(200, {});
    (res as unknown as Record<string, boolean>)[NOT_FOUND_FLAG] = true;
    res.writeHead(200, {});

    expect(calls[0]?.status).toBe(200);
    expect(calls[1]?.status).toBe(404);
    expect(calls).toHaveLength(2);
  });

  it('initialises the flag so the component only has to set it', async () => {
    const { event, res } = makeEvent();
    await notFoundStatusMiddleware(event);

    expect((res as unknown as Record<string, boolean>)[NOT_FOUND_FLAG]).toBe(false);
  });
});
