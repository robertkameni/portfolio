import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, Directive, ElementRef, inject, OnDestroy, PLATFORM_ID } from '@angular/core';

/**
 * Marks the nav link whose section is in the reading band under the sticky
 * header. The band is the observer root, so this never listens to scroll.
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

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    afterNextRender(() => this.bind());
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.mutations?.disconnect();
    this.mutations = null;
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
    this.observer = new IntersectionObserver(() => this.mark(pairs), { threshold: [0, 0.25, 0.6] });

    for (const { section } of pairs) {
      this.observer.observe(section);
    }
  }

  private mark(pairs: { link: HTMLAnchorElement; section: HTMLElement }[]): void {
    // The last section whose top has crossed the reading line stays current,
    // including through the stretches (the tool sheet) that have no link.
    const line = window.innerHeight * 0.28;
    let current = '';
    for (const { section } of pairs) {
      if (section.getBoundingClientRect().top <= line) {
        current = section.id;
      }
    }

    for (const { link, section } of pairs) {
      if (current !== '' && section.id === current) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }
}
