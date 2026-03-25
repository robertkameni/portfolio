import { Directive, ElementRef, Input, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';

@Directive({
  selector: '[trackBehavior]',
  standalone: true
})
export class TrackBehaviorDirective implements OnInit, OnDestroy {
  @Input('trackBehavior') behaviorName!: string;
  private readonly el = inject(ElementRef);
  private readonly analytics = inject(AnalyticsService);
  private readonly platformId = inject(PLATFORM_ID);
  private observer!: IntersectionObserver;

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('[TrackBehaviorDirective] Skipping IntersectionObserver on server');
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.analytics.trackBehavior(this.behaviorName);
          this.observer.disconnect();
        }
      });
    }, { threshold: 0.5 });

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
