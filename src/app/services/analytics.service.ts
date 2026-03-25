import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VisitorStore } from '../store/visitor.store';
import { isPlatformBrowser } from '@angular/common';
import type { VisitorProfileAnalysis } from '../shared/types/visitor.types';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly visitorStore = inject(VisitorStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly clientSessionId?: string;

  constructor() {
    // Only access sessionStorage in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.clientSessionId = sessionStorage.getItem('clientSessionId') || crypto.randomUUID();
      sessionStorage.setItem('clientSessionId', this.clientSessionId);
    }
  }

  public getClientSessionId(): string {
    if (!this.clientSessionId) {
      // SSR fallback
      return 'ssr-session';
    }
    return this.clientSessionId;
  }

  trackPageView(url: string): void {
    const sessionId = this.getClientSessionId();
    const body = {
      clientSessionId: sessionId,
      eventType: 'page_view',
      payload: { url },
    };

    if (isPlatformBrowser(this.platformId)) {
      this.http.post('/api/analytics/event', body).subscribe({
        error: (err) => console.error('Analytics page view tracking error:', err),
      });
    }
  }

  trackBehavior(behaviorName: string): void {
    const sessionId = this.getClientSessionId();
    const body = {
      clientSessionId: sessionId,
      eventType: 'behavior_track',
      payload: { behaviorName },
    };

    if (isPlatformBrowser(this.platformId)) {
      this.http.post('/api/analytics/event', body).subscribe({
        error: (err) => console.error('Analytics behavior tracking error:', err),
      });
    }
  }

  triggerAnalysis(): void {
    this.visitorStore.setLoading(true);
    const sessionId = this.getClientSessionId();
    this.http.post<VisitorProfileAnalysis>('/api/ai/analyze-visitor', { clientSessionId: sessionId }).subscribe({
      next: (profile) => {
        this.visitorStore.setProfile(profile);
        this.visitorStore.setLoading(false);
      },
      error: (err) => {
        console.error('AI analysis trigger error:', err);
        this.visitorStore.setLoading(false);
      },
    });
  }
}
