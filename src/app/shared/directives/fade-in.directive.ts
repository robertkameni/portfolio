import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';

@Directive({
  selector: '[fadeIn]',
  standalone: true,
})
export class FadeInDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const node = this.el.nativeElement;

    if (this.prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      node.dataset['visible'] = 'true';
      return;
    }

    node.classList.add('reveal');

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.reveal();
        }
      },
      { threshold: 0.12 },
    );

    this.observer.observe(node);

    if (this.isInViewport(node)) {
      requestAnimationFrame(() => requestAnimationFrame(() => this.reveal()));
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private reveal(): void {
    this.el.nativeElement.dataset['visible'] = 'true';
    this.observer?.disconnect();
    this.observer = null;
  }

  private prefersReducedMotion(): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private isInViewport(node: HTMLElement): boolean {
    const rect = node.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }
}
