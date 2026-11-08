import { isPlatformBrowser } from '@angular/common';
import { Directive, effect, ElementRef, inject, input, OnDestroy, PLATFORM_ID } from '@angular/core';

/**
 * Steps a floating control aside while a given section is on screen.
 *
 * The chat launcher is fixed to the bottom-right corner. On a phone the contact
 * form's submit button is full width and reaches that corner, so the launcher
 * sat on top of the primary CTA: tapping the right half of "Send" opened the
 * chat instead of sending. Two CTAs competing for one tap is a layout bug, not
 * a matter of taste.
 *
 * Scoped to narrow viewports on purpose. From `md` up the submit button sits in
 * a column and only its bottom-right corner grazes the launcher while the page
 * is scrolled to the very end; its label and main tap area stay clear. Hiding
 * the launcher there removed the only entry point to the chat, which is worse
 * than the corner it was protecting.
 *
 * The host is marked with `data-yielded`, which styles.css turns into a hidden,
 * non-focusable element. Hiding via visibility also removes it from the tab
 * order and the accessibility tree; an invisible but tappable button would be
 * worse than the overlap.
 */
@Directive({
  selector: '[yieldToSection]',
  standalone: true,
})
export class YieldToSectionDirective implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  /** CSS selector of the section that takes precedence, e.g. `contact`. */
  targetSelector = input.required<string>({ alias: 'yieldToSection' });

  /** Turn the behaviour off, e.g. while the chat panel is open. */
  enabled = input(true);

  private observer: IntersectionObserver | null = null;
  private pendingTarget: MutationObserver | null = null;
  private narrowViewport: MediaQueryList | null = null;
  private targetVisible = false;

  constructor() {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.narrowViewport = window.matchMedia('(max-width: 767px)');
    this.narrowViewport.addEventListener('change', this.onViewportChange);

    // Re-arms whenever `enabled` flips: opening the chat must not hide the
    // control that closes it again.
    effect(() => {
      const enabled = this.enabled();
      this.detach();
      if (!enabled) {
        this.clear();
        return;
      }
      // The target often lives behind `@defer`, so it may not exist yet.
      // Watching for it once is cheaper and more reliable than guessing a delay.
      queueMicrotask(() => this.attach());
    });
  }

  ngOnDestroy(): void {
    this.detach();
    this.narrowViewport?.removeEventListener('change', this.onViewportChange);
    this.narrowViewport = null;
  }

  private readonly onViewportChange = (): void => {
    // Crossing the breakpoint changes whether there is anything to yield for.
    this.apply(this.targetVisible);
  };

  private attach(): void {
    if (!this.enabled()) {
      return;
    }

    const target = document.querySelector(this.targetSelector());
    if (target) {
      this.observe(target);
      return;
    }

    this.pendingTarget = new MutationObserver(() => {
      const found = document.querySelector(this.targetSelector());
      if (!found) {
        return;
      }
      this.pendingTarget?.disconnect();
      this.pendingTarget = null;
      this.observe(found);
    });
    this.pendingTarget.observe(document.body, { childList: true, subtree: true });
  }

  private observe(target: Element): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        this.targetVisible = entry.isIntersecting;
        this.apply(this.targetVisible);
      },
      // Leaves a little earlier than the exact edge, so the launcher is gone
      // before the CTA becomes reachable rather than at the same moment.
      { rootMargin: '0px 0px -48px 0px' },
    );
    this.observer.observe(target);
  }

  private apply(yielded: boolean): void {
    if (!this.enabled() || !this.isNarrowViewport()) {
      this.clear();
      return;
    }
    this.host.nativeElement.toggleAttribute('data-yielded', yielded);
  }

  private isNarrowViewport(): boolean {
    return this.narrowViewport?.matches ?? false;
  }

  private clear(): void {
    this.host.nativeElement.removeAttribute('data-yielded');
  }

  private detach(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.pendingTarget?.disconnect();
    this.pendingTarget = null;
  }
}
