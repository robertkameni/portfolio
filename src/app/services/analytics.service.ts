import { inject, isDevMode, PLATFORM_ID, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import type { ApiSuccess } from '../shared/types/api.types';
import type { VisitorProfileAnalysis } from '../shared/types/visitor.types';
import { VisitorStore } from '../store/visitor.store';

type QueuedAnalyticsEvent = {
  clientSessionId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

type SyncResultBody = {
  result: 'ignored' | 'accepted' | 'partial';
  totalEvents: number;
  persistedEvents: number;
  failedEvents: number;
  skippedEvents: number;
};

type AnalyzeVisitorOutcome = { result: 'skipped'; reason: string } | { result: 'accepted'; reason: string; profileNotBeforeMs: number };

type VisitorIntelPollData = { ready: false } | { ready: true; profileData: VisitorProfileAnalysis; updatedAt: string };

@Service()
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly visitorStore = inject(VisitorStore);
  private readonly clientSessionId?: string;

  private eventQueue: QueuedAnalyticsEvent[] = [];
  private isFlushing = false;

  private unanalyzedEventCount = 0;
  private isAnalysisInFlight = false;
  private lastAnalysisAt = 0;
  private analysisTimer: ReturnType<typeof setTimeout> | null = null;
  /** Browser timers use numeric handles; avoids NodeJS `Timeout` vs `number` typing clashes. */
  private intelPollHandle: number | null = null;

  private readonly EVENTS_BEFORE_ANALYSIS = 4;
  private readonly ANALYSIS_DEBOUNCE_MS = 15_000;
  private readonly ANALYSIS_COOLDOWN_MS = 120_000;
  private readonly SYNC_BATCH_SIZE = 50;

  private readonly SYNC_ENDPOINT = '/api/sys/sync';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.clientSessionId = sessionStorage.getItem('clientSessionId') || crypto.randomUUID();
      sessionStorage.setItem('clientSessionId', this.clientSessionId);

      window.addEventListener('pagehide', () => {
        if (this.eventQueue.length === 0) return;
        const blob = new Blob([JSON.stringify(this.eventQueue)], { type: 'application/json' });
        navigator.sendBeacon(this.SYNC_ENDPOINT, blob);
      });
    }
  }

  public getClientSessionId(): string {
    return this.clientSessionId || 'ssr-session';
  }

  trackPageView(url: string): void {
    this.queueEvent('page_view', { url });
  }

  trackBehavior(behaviorName: string): void {
    this.queueEvent('behavior_track', { behaviorName });
  }

  private queueEvent(eventType: string, payload: Record<string, unknown>) {
    if (!isPlatformBrowser(this.platformId)) return;

    this.eventQueue.push({
      clientSessionId: this.getClientSessionId(),
      eventType,
      payload,
    });

    if (!this.isFlushing) {
      void this.flushQueue();
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {
      this.isFlushing = false;
      return;
    }

    this.isFlushing = true;
    const batch = this.eventQueue.splice(0, this.SYNC_BATCH_SIZE);
    let shouldRetryLater = false;

    try {
      const res = await firstValueFrom(this.http.post<ApiSuccess<SyncResultBody>>(this.SYNC_ENDPOINT, batch));
      const persisted = res.data?.persistedEvents ?? 0;

      this.unanalyzedEventCount += persisted;
      if (this.unanalyzedEventCount >= this.EVENTS_BEFORE_ANALYSIS) {
        this.scheduleAnalysis();
      }
    } catch {
      this.eventQueue = [...batch, ...this.eventQueue];
      shouldRetryLater = true;
    } finally {
      if (shouldRetryLater) {
        setTimeout(() => {
          void this.flushQueue();
        }, 500);
        return;
      }

      if (this.eventQueue.length > 0) {
        void this.flushQueue();
      } else {
        this.isFlushing = false;
      }
    }
  }

  private scheduleAnalysis(): void {
    if (!isPlatformBrowser(this.platformId) || this.analysisTimer) {
      return;
    }

    this.analysisTimer = setTimeout(() => {
      this.analysisTimer = null;
      this.triggerAnalysis();
    }, this.ANALYSIS_DEBOUNCE_MS);
  }

  triggerAnalysis(): void {
    if (!isPlatformBrowser(this.platformId) || this.isAnalysisInFlight) return;
    if (this.unanalyzedEventCount < this.EVENTS_BEFORE_ANALYSIS) return;

    const now = Date.now();
    if (now - this.lastAnalysisAt < this.ANALYSIS_COOLDOWN_MS) {
      return;
    }

    this.isAnalysisInFlight = true;

    // Fire-and-forget. Realtime SSE can push visitor_profile_updated; polling uses profileNotBeforeMs from the API (same clock as DB).
    this.http
      .post<ApiSuccess<AnalyzeVisitorOutcome>>('/api/ai/analyze-visitor', {
        clientSessionId: this.getClientSessionId(),
      })
      .subscribe({
        next: (res) => {
          const data = res?.data;

          if (data?.result === 'accepted' && typeof data.profileNotBeforeMs === 'number') {
            this.lastAnalysisAt = Date.now();
            this.unanalyzedEventCount = 0;
            this.pollVisitorProfileAfterAnalysis(data.profileNotBeforeMs);
            return;
          }

          if (data?.result === 'accepted') {
            console.warn('[Analytics] Analysis accepted without profileNotBeforeMs; client counters unchanged.');
            return;
          }

          if (data?.result === 'skipped') {
            if (isDevMode()) {
              console.debug('[Analytics] Analysis skipped:', res.code, data.reason);
            }
          }
        },
        error: (err) => {
          console.error('[AI Analysis] Trigger error:', err);
        },
        complete: () => {
          this.isAnalysisInFlight = false;
        },
      });
  }

  private clearIntelPolling(): void {
    if (this.intelPollHandle != null) {
      clearTimeout(this.intelPollHandle);
      this.intelPollHandle = null;
    }
  }

  private pollVisitorProfileAfterAnalysis(profileNotBeforeMs: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.clearIntelPolling();

    const delayMs = 2500;
    const maxAttempts = 40;

    let attempt = 0;

    const poll = (): void => {
      if (++attempt > maxAttempts) {
        return;
      }

      this.http
        .get<ApiSuccess<VisitorIntelPollData>>('/api/ai/visitor-intelligence', {
          params: {
            clientSessionId: this.getClientSessionId(),
            sinceMs: String(profileNotBeforeMs),
          },
        })
        .subscribe({
          next: (res) => {
            const d = res?.data;

            if (d?.ready && d.profileData) {
              this.visitorStore.setProfile(d.profileData);
              return;
            }

            this.intelPollHandle = window.setTimeout(poll, delayMs);
          },
          error: () => {
            this.intelPollHandle = window.setTimeout(poll, delayMs + 1500);
          },
        });
    };

    poll();
  }
}
