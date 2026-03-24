import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';

@Directive({
  selector: '[trackBehavior]',
  standalone: true
})
export class TrackBehaviorDirective implements OnInit, OnDestroy {
  @Input('trackBehavior') behaviorName!: string;
  private readonly el = inject(ElementRef);
  private readonly analytics = inject(AnalyticsService);
  private observer!: IntersectionObserver;

  ngOnInit() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.analytics.trackBehavior(this.behaviorName);
          // Only track once per instance
          this.observer.disconnect();
        }
      });
    }, { threshold: 0.5 }); // Trigger when 50% visible

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
