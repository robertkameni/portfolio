import { Directive, ElementRef, inject, input, isDevMode, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';

let hasLoggedServerSkip = false;

@Directive({
  selector: '[trackBehavior]',
  standalone: true,
})
export class TrackBehaviorDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly analytics = inject(AnalyticsService);
  private readonly platformId = inject(PLATFORM_ID);

  trackBehavior = input<string>();

  private observer!: IntersectionObserver;

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      if (isDevMode() && !hasLoggedServerSkip) {
        hasLoggedServerSkip = true;
        console.info('[TrackBehaviorDirective] IntersectionObserver skipped on server render.');
      }
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.analytics.trackBehavior(this.trackBehavior() ?? '');
            this.observer.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
