import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VisitorStore } from '../store/visitor.store';
import type { VisitorProfileAnalysis } from '../shared/types/visitor.types';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly visitorStore = inject(VisitorStore);
  private readonly clientSessionId: string;

  constructor() {
    this.clientSessionId = sessionStorage.getItem('clientSessionId') || crypto.randomUUID();
    sessionStorage.setItem('clientSessionId', this.clientSessionId);
  }

  public getClientSessionId(): string {
    return this.clientSessionId;
  }

  /**
   * Tracks a page view event.
   * @param url The URL of the page being viewed.
   */
  trackPageView(url: string): void {
    const body = {
      clientSessionId: this.clientSessionId,
      eventType: 'page_view',
      payload: { url },
    };

    this.http.post('/api/analytics/event', body)
      .subscribe({
        error: (err) => console.error('Analytics page view tracking error:', err),
      });
  }

  trackBehavior(behaviorName: string): void {
    const body = {
      clientSessionId: this.clientSessionId,
      eventType: 'behavior_track',
      payload: { behaviorName },
    };

    this.http.post('/api/analytics/event', body)
      .subscribe({
        error: (err) => console.error('Analytics behavior tracking error:', err),
      });
  }

  /**
   * Triggers the backend AI analysis for the current session.
   */
  triggerAnalysis(): void {
    this.visitorStore.setLoading(true);
    this.http.post<VisitorProfileAnalysis>('/api/ai/analyze-visitor', { clientSessionId: this.clientSessionId })
      .subscribe({
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
