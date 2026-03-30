import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VisitorStore } from '../store/visitor.store';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly visitorStore = inject(VisitorStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly clientSessionId?: string;

  private eventQueue: any[] = [];
  private isFlushing = false;

  private unanalyzedEventCount = 0;
  private readonly EVENTS_BEFORE_ANALYSIS = 5;

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

  private queueEvent(eventType: string, payload: any) {
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
    const batch = [...this.eventQueue];
    const batchSize = batch.length;
    this.eventQueue = [];

    try {
      await firstValueFrom(this.http.post(this.SYNC_ENDPOINT, batch));

      this.unanalyzedEventCount += batchSize;

      if (this.unanalyzedEventCount >= this.EVENTS_BEFORE_ANALYSIS) {
        this.triggerAnalysis();
        this.unanalyzedEventCount = 0;
      }
    } catch {
    } finally {
      if (this.eventQueue.length > 0) {
        void this.flushQueue();
      } else {
        this.isFlushing = false;
      }
    }
  }

  triggerAnalysis(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Fire-and-forget. The RealtimeService (SSE) will handle the response.
    this.http.post('/api/ai/analyze-visitor', { clientSessionId: this.getClientSessionId() }).subscribe({
      error: (err) => console.error('[AI Analysis] Trigger error:', err),
    });
  }
}
