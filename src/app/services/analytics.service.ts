import {inject, Injectable, PLATFORM_ID} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {VisitorStore} from '../store/visitor.store';
import {isPlatformBrowser} from '@angular/common';
import type {VisitorProfileAnalysis} from '../shared/types/visitor.types';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly visitorStore = inject(VisitorStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly clientSessionId?: string;

  private eventQueue: any[] = [];
  private isBatching = false;

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
      payload
    });

    if (!this.isBatching) {
      this.isBatching = true;
      setTimeout(() => this.flushQueue(), 2500);
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {
      this.isBatching = false;
      return;
    }

    const batch = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await firstValueFrom(this.http.post(this.SYNC_ENDPOINT, batch));
    } catch (err) {
      console.debug('[SysSync] Batch dropped');
    } finally {
      this.isBatching = false;
      if (this.eventQueue.length > 0) {
        this.isBatching = true;
        setTimeout(() => this.flushQueue(), 2500);
      }
    }
  }

  triggerAnalysis(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.visitorStore.setLoading(true);

    this.http.post<VisitorProfileAnalysis>('/api/ai/analyze-visitor', {clientSessionId: this.getClientSessionId()}).subscribe({
      next: (profile) => {
        this.visitorStore.setProfile(profile);
        this.visitorStore.setLoading(false);
      },
      error: () => this.visitorStore.setLoading(false)
    });
  }
}
