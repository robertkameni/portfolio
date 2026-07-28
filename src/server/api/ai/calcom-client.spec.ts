// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCalcomClient, resetCalcomClientCacheForTests } from './calcom-client';

describe('calcom-client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetCalcomClientCacheForTests();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('uses the slots API version when fetching availability', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    }) as unknown as typeof fetch;

    const client = createCalcomClient({ apiKey: 'cal_test', eventTypeId: 123 });
    await client.getAvailability('tomorrow');

    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['cal-api-version']).toBe('2024-09-04');
  });

  it('uses the bookings API version when creating a booking', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { uid: 'booking-1', start: '2026-07-29T13:00:00Z' } }),
    }) as unknown as typeof fetch;

    const client = createCalcomClient({ apiKey: 'cal_test', eventTypeId: 123 });
    await client.bookMeeting({ email: 'guest@example.com', startTime: '2026-07-29T13:00:00Z' });

    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['cal-api-version']).toBe('2026-02-25');
  });

  it('returns availability slots on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          '2026-07-29': [{ start: '2026-07-29T13:00:00Z', end: '2026-07-29T13:30:00Z' }],
        },
      }),
    }) as unknown as typeof fetch;

    const client = createCalcomClient({ apiKey: 'cal_test', eventTypeId: 123 });
    const result = await client.getAvailability('2026-07-29');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slots).toHaveLength(1);
      expect(result.slots[0]?.start).toBe('2026-07-29T13:00:00Z');
    }
  });

  it('maps booking conflict to human-readable error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => 'conflict',
    }) as unknown as typeof fetch;

    const client = createCalcomClient({ apiKey: 'cal_test', eventTypeId: 123 });
    const result = await client.bookMeeting({
      email: 'guest@example.com',
      startTime: '2026-07-29T13:00:00Z',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('no longer available');
    }
  });

  it('creates booking on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          uid: 'booking-1',
          start: '2026-07-29T13:00:00Z',
          meetingUrl: 'https://meet.google.com/abc',
        },
      }),
    }) as unknown as typeof fetch;

    const client = createCalcomClient({ apiKey: 'cal_test', eventTypeId: 123 });
    const result = await client.bookMeeting({
      email: 'guest@example.com',
      startTime: '2026-07-29T13:00:00Z',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.bookingUid).toBe('booking-1');
      expect(result.meetingUrl).toContain('meet.google.com');
    }
  });
});
