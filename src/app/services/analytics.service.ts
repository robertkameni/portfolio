import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

type QueuedAnalyticsEvent = {
  clientSessionId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly clientSessionId?: string;

  private eventQueue: QueuedAnalyticsEvent[] = [];
  private isFlushing = false;

  private unanalyzedEventCount = 0;
  private isAnalysisInFlight = false;
  private lastAnalysisAt = 0;
  private analysisTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly EVENTS_BEFORE_ANALYSIS = 25;
  private readonly ANALYSIS_DEBOUNCE_MS = 45_000;
  private readonly ANALYSIS_COOLDOWN_MS = 600_000;
  private readonly SYNC_BATCH_SIZE = 50;

  private readonly SYNC_ENDPOINT = '/api/sys/sync';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.clientSessionId = sessionStorage.getItem('clientSessionId') || crypto.randomUUID();
      sessionStorage.setItem('clientSessionId', this.clientSessionId);
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
    const batchSize = batch.length;
    let shouldRetryLater = false;

    try {
      await firstValueFrom(this.http.post(this.SYNC_ENDPOINT, batch));

      this.unanalyzedEventCount += batchSize;
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
    this.lastAnalysisAt = now;

    // Fire-and-forget. The RealtimeService (SSE) handles updates.
    this.http.post('/api/ai/analyze-visitor', { clientSessionId: this.getClientSessionId() }).subscribe({
      next: () => {
        this.unanalyzedEventCount = 0;
      },
      error: (err) => {
        console.error('[AI Analysis] Trigger error:', err);
      },
      complete: () => {
        this.isAnalysisInFlight = false;
      },
    });
  }
}
