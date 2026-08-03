import { afterNextRender, Component, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, tap } from 'rxjs/operators';
import { AnalyticsService } from './services/analytics.service';
import { RealtimeService } from './services/realtime.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.router.events
        .pipe(
          filter((event): event is NavigationEnd => event instanceof NavigationEnd),
          tap(() => {
            if (!this.realtimeService.isRealtimeActive() && this.realtimeService.connectionStatus() !== 'connecting') {
              const clientSessionId = this.analyticsService.getClientSessionId();
              this.realtimeService.connect(clientSessionId);
            }
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((event) => {
          this.analyticsService.trackPageView(event.urlAfterRedirects);
        });
    });
  }
}
