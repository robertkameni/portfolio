import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, tap } from 'rxjs/operators';
import { AnalyticsService } from './services/analytics.service';
import { RealtimeService } from './services/realtime.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly realtimeService = inject(RealtimeService);
  private realtimeConnected = false;

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        tap(() => {
          if (!this.realtimeConnected) {
            this.realtimeConnected = true;
            const clientSessionId = this.analyticsService.getClientSessionId();
            this.realtimeService.connect(clientSessionId);
          }
        }),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.analyticsService.trackPageView(event.urlAfterRedirects);
      });
  }
}
