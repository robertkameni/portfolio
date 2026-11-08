import { describe, expect, it, vi, beforeEach } from 'vitest';

const findAllPublished = vi.fn();

vi.mock('../../db/repositories/project.repository', () => ({
  projectRepository: { findAllPublished: () => findAllPublished() },
}));

const { default: handler } = await import('./index.get');

type HeaderStore = Record<string, string>;

function makeEvent(): { event: never; headers: HeaderStore } {
  const headers: HeaderStore = {};
  const event = {
    node: { res: { statusCode: 0, setHeader: (name: string, value: string) => (headers[name.toLowerCase()] = value) } },
    context: {},
    _handled: false,
    setResponseHeader: (name: string, value: string) => (headers[name.toLowerCase()] = value),
  };
  return { event: event as never, headers };
}

describe('GET /api/projects', () => {
  beforeEach(() => {
    findAllPublished.mockReset();
  });

  it('returns the published list on success', async () => {
    findAllPublished.mockResolvedValue([{ id: 'p1', slug: 'demo', title: 'Demo' }]);
    const { event } = makeEvent();

    const result = (await handler(event)) as { data: unknown[]; status: string };

    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(1);
  });

  it('does not disguise a database outage as an empty list', async () => {
    findAllPublished.mockRejectedValue(new Error('Authentication failed against the database server'));

    await expect(handler(makeEvent().event)).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('does not advertise a cacheable response when the query failed', async () => {
    findAllPublished.mockRejectedValue(new Error('connection refused'));
    const { event, headers } = makeEvent();

    await expect(handler(event)).rejects.toBeTruthy();

    // A cached empty list would keep the site looking empty for minutes after recovery.
    expect(headers['cache-control']).toBe('no-store');
  });

  it('still sets a short cache header on success', async () => {
    findAllPublished.mockResolvedValue([]);
    const { event, headers } = makeEvent();

    await handler(event);

    expect(headers['cache-control']).toContain('max-age=60');
  });
});
