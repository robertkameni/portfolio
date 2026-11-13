import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, Directive, ElementRef, inject, OnDestroy, PLATFORM_ID } from '@angular/core';

/**
 * Marks the nav link for the section that has reached the sticky header.
 * IntersectionObserver refreshes the mark as sections cross that edge.
 * `scrollend` runs it once more when a tap's smooth scroll actually stops,
 * because the last observer callback can land a few pixels too early.
 */
@Directive({
  selector: '[activeSection]',
  standalone: true,
})
export class ActiveSectionDirective implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;
  private mutations: MutationObserver | null = null;
  private pairsCache: { link: HTMLAnchorElement; section: HTMLElement }[] = [];
  private readonly onSettle = () => {
    if (this.pairsCache.length > 0) {
      this.mark(this.pairsCache);
    }
  };

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    afterNextRender(() => this.bind());
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.observer?.disconnect();
    this.observer = null;
    this.mutations?.disconnect();
    this.mutations = null;
    document.removeEventListener('scrollend', this.onSettle);
    window.visualViewport?.removeEventListener('resize', this.onSettle);
  }

  private bind(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const pairs = this.pairs();
    if (pairs.length > 0) {
      this.observe(pairs);
      return;
    }

    const root = document.getElementById('main');
    if (!root || typeof MutationObserver === 'undefined') {
      return;
    }

    this.mutations = new MutationObserver(() => {
      const ready = this.pairs();
      if (ready.length === 0) {
        return;
      }
      this.mutations?.disconnect();
      this.mutations = null;
      this.observe(ready);
    });
    this.mutations.observe(root, { childList: true, subtree: true });
  }

  private pairs(): { link: HTMLAnchorElement; section: HTMLElement }[] {
    return [...this.el.nativeElement.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].flatMap((link) => {
      const id = link.getAttribute('href')?.slice(1);
      const section = id ? document.getElementById(id) : null;
      return section ? [{ link, section }] : [];
    });
  }

  private observe(pairs: { link: HTMLAnchorElement; section: HTMLElement }[]): void {
    this.pairsCache = pairs;
    this.observer = new IntersectionObserver(() => this.mark(pairs), { threshold: [0, 0.25, 0.6] });

    for (const { section } of pairs) {
      this.observer.observe(section);
    }

    document.addEventListener('scrollend', this.onSettle);
    window.visualViewport?.addEventListener('resize', this.onSettle);
    this.mark(pairs);
  }

  private readingLine(): number {
    const header = document.querySelector('site-toolbar');
    const underHeader = header ? header.getBoundingClientRect().bottom : 0;
    // A tapped section stops with its top against the header. On a phone that
    // edge sits below 28% of the viewport, so a fraction-of-the-screen line
    // leaves the mark on the previous item.
    return underHeader + 12;
  }

  private mark(pairs: { link: HTMLAnchorElement; section: HTMLElement }[]): void {
    const current = this.currentSection(pairs);

    for (const { link, section } of pairs) {
      if (current !== '' && section.id === current) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  /**
   * The section the reader is in.
   *
   * A section that covers the reading line owns the marker. When the line
   * falls in a stretch with no link under it, the marker follows what is
   * actually on screen: a section has to fill more than half of the space
   * below the header. Picking "the last section whose top went past the line"
   * instead would keep the previous item marked long after its content had
   * scrolled away, which is what put the mark on Projects while the contact
   * heading filled the screen.
   */
  private currentSection(pairs: { link: HTMLAnchorElement; section: HTMLElement }[]): string {
    const line = this.readingLine();
    const viewport = window.innerHeight;
    let covering = '';
    // Bar for taking the mark without covering the line. A section that only
    // peeks in at the bottom does not get it.
    let dominant = (viewport - line) / 2;
    let closest = '';

    for (const { section } of pairs) {
      const { top, bottom } = section.getBoundingClientRect();

      if (top <= line && bottom > line) {
        covering = section.id;
      }

      const visible = Math.min(bottom, viewport) - Math.max(top, line);
      if (visible > dominant) {
        dominant = visible;
        closest = section.id;
      }
    }

    return covering !== '' ? covering : closest;
  }
}
