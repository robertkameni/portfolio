import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AnalyticsService } from './analytics.service';
import { VisitorStore } from '../store/visitor.store';

describe('AnalyticsService sync resilience', () => {
  let service: AnalyticsService;
  let httpMock: HttpTestingController;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AnalyticsService, { provide: VisitorStore, useValue: { setProfile: () => undefined } }],
    });
    service = TestBed.inject(AnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach((request) => request.flush({}, { status: 500, statusText: 'teardown' }));
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Server is down: fail every request that appears and let the service's timers run. */
  async function failEveryAttempt(maxRounds = 12): Promise<number> {
    let attempts = 0;

    for (let round = 0; round < maxRounds; round++) {
      await vi.advanceTimersByTimeAsync(0);
      const pending = httpMock.match('/api/sys/sync');
      if (pending.length === 0) {
        // nothing scheduled right now; move the clock and try again
        await vi.advanceTimersByTimeAsync(60_000);
        continue;
      }

      attempts += pending.length;
      pending.forEach((request) => request.flush({}, { status: 500, statusText: 'Server Error' }));
    }

    return attempts;
  }

  it('gives up after a bounded number of attempts instead of retrying forever', async () => {
    service.trackPageView('/');

    const attempts = await failEveryAttempt();

    // Bounded: a handful of attempts, not hundreds.
    expect(attempts).toBeGreaterThan(1);
    expect(attempts).toBeLessThanOrEqual(4);
  });

  it('goes quiet once it has given up', async () => {
    service.trackPageView('/');
    await failEveryAttempt();

    httpMock.match(() => true).forEach((request) => request.flush({}, { status: 500, statusText: 'late' }));
    await vi.advanceTimersByTimeAsync(10 * 60_000);

    expect(httpMock.match(() => true).length).toBe(0);
  });

  it('does not write a console error for every failed attempt', async () => {
    service.trackPageView('/');
    await failEveryAttempt();

    // A flood of identical console errors is what made the reported log unreadable.
    expect(errorSpy.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('tries again after the cooldown has elapsed', async () => {
    service.trackPageView('/');
    await failEveryAttempt();

    // Wait out the cooldown, then a new navigation should re-arm the flush.
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    service.trackPageView('/projects');

    await vi.advanceTimersByTimeAsync(0);
    expect(httpMock.match('/api/sys/sync').length).toBeGreaterThan(0);
  });
});
