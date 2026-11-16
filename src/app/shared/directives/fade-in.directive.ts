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

    /* Read before write. Hiding the node first (`.reveal` sets opacity 0) and
       then measuring its position invalidates style and forces a synchronous
       layout, once per section, in the middle of hydration. Reading first lets
       every measurement reuse the layout the browser already has. Content that
       is already on screen is also never hidden, so hydrating a server-rendered
       page cannot make the first screen blink. */
    if (this.isInViewport(node)) {
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
