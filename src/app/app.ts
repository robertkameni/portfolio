import { afterNextRender, Component, DestroyRef, DOCUMENT, effect, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, tap } from 'rxjs/operators';
import { AnalyticsService } from './services/analytics.service';
import { RealtimeService } from './services/realtime.service';
import { LocaleService } from './shared/services/locale.service';
import { PageMetaService } from './shared/services/page-meta.service';

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
  private readonly document = inject(DOCUMENT);
  private readonly localeService = inject(LocaleService);
  private readonly pageMeta = inject(PageMetaService);

  constructor() {
    /**
     * The document language is the resolved one, not the `lang="en"` baked into
     * index.html. That static value claimed English on a German page, which
     * misleads screen readers (they pick a voice) and search engines (they
     * index a language). An effect runs during SSR too, so the attribute is in
     * the HTML the crawler receives rather than only after hydration.
     *
     * A route can override it: the CV is German whatever the visitor's locale,
     * so `/cv` sets an override and the printed PDF carries `lang="de"` instead
     * of the reader's language.
     */
    effect(() => {
      this.document.documentElement.lang = this.pageMeta.langOverride() ?? this.localeService.locale();
    });

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
          // Keep a visitor-chosen `?lang=` in the address bar across in-app
          // navigation, so refresh and sharing stay in their language.
          this.localeService.syncLangQueryParam();
          this.analyticsService.trackPageView(event.urlAfterRedirects);
        });
    });
  }
}
