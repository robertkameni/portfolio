import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { AnalyticsService } from './services/analytics.service';
import { RealtimeService } from './services/realtime.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet
  ],
  template: '<router-outlet />',
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly realtimeService = inject(RealtimeService);

  ngOnInit(): void {
    // Track initial page view and then connect to the real-time service
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      take(1) // We only need the very first navigation event to start everything
    ).subscribe(event => {
      const clientSessionId = this.analyticsService.getClientSessionId();
      this.analyticsService.trackPageView(event.urlAfterRedirects);
      this.realtimeService.connect(clientSessionId);

      // After the first event, we can trigger the AI analysis
      this.analyticsService.triggerAnalysis();
    });

    // Continue tracking subsequent page views
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(event => {
      this.analyticsService.trackPageView(event.urlAfterRedirects);
    });
  }
}
