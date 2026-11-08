import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RealtimeService } from './realtime.service';
import { VisitorStore } from '../store/visitor.store';
import { ChatStore } from '../store/chat.store';
import { AnalyticsService } from './analytics.service';

describe('RealtimeService outage handling', () => {
  let service: RealtimeService;
  let fetchMock: ReturnType<typeof vi.fn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      headers: { get: () => 'application/json' },
      json: async () => ({ status: 'error', message: 'Realtime service temporarily unavailable.' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    TestBed.configureTestingModule({
      providers: [
        RealtimeService,
        { provide: VisitorStore, useValue: { setProfile: () => undefined } },
        { provide: ChatStore, useValue: { messages: () => [], appendAssistantToken: () => undefined, setTyping: () => undefined } },
        { provide: AnalyticsService, useValue: { getClientSessionId: () => 'session-1' } },
      ],
    });
    service = TestBed.inject(RealtimeService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Let the token retry chain (300ms, 600ms, 1200ms) run to exhaustion. */
  async function exhaustTokenRetries(): Promise<void> {
    service.connect('session-1');
    for (let i = 0; i < 6; i++) {
      await vi.advanceTimersByTimeAsync(2_000);
    }
    await vi.advanceTimersByTimeAsync(0);
  }

  it('gives up after a bounded number of token attempts', async () => {
    await exhaustTokenRetries();

    expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it('stays disconnected without refetching when a navigation happens during the cooldown', async () => {
    await exhaustTokenRetries();
    const callsAfterFirstFailure = fetchMock.mock.calls.length;

    service.connect('session-1');
    await vi.advanceTimersByTimeAsync(5_000);

    expect(fetchMock.mock.calls.length).toBe(callsAfterFirstFailure);
    expect(service.connectionStatus()).toBe('disconnected');
  });

  it('logs the outage once, not a full error object per attempt', async () => {
    await exhaustTokenRetries();

    expect(errorSpy.mock.calls.length).toBe(0);
    expect(warnSpy.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('tries again after the cooldown has elapsed', async () => {
    await exhaustTokenRetries();
    const callsAfterFirstFailure = fetchMock.mock.calls.length;

    await vi.advanceTimersByTimeAsync(90_000);
    service.connect('session-1');
    await vi.advanceTimersByTimeAsync(2_000);

    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsAfterFirstFailure);
  });
});
