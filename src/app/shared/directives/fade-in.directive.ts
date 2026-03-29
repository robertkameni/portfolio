import {Directive, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

@Directive({
  selector: '[fadeIn]',
  standalone: true
})
export class FadeInDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private observer!: IntersectionObserver;

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Start with the element being invisible and slightly moved down
    this.el.nativeElement.style.opacity = '0';
    this.el.nativeElement.style.transform = 'translateY(20px)';
    this.el.nativeElement.style.transition = 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out';

    const trigger = () => {
      this.el.nativeElement.style.opacity = '1';
      this.el.nativeElement.style.transform = 'translateY(0)';
      if (this.observer) {
        try {
          this.observer.unobserve(this.el.nativeElement);
        } catch {
        }
      }
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          trigger();
        }
      });
    }, {threshold: 0.1});

    this.observer.observe(this.el.nativeElement);

    // Fallback: if the element is already in the viewport on mount, trigger the animation
    try {
      const rect = this.el.nativeElement.getBoundingClientRect();
      const inViewport = rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0;
      if (inViewport) {
        requestAnimationFrame(() => requestAnimationFrame(trigger));
      }
    } catch (e) {
      // ignore in non-browser environments
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
