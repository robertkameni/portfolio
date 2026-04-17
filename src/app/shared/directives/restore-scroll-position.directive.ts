import { AfterViewInit, Directive, ElementRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

const PROJECTS_SECTION_FRAGMENT = 'projects-section';

@Directive({
  selector: '[restoreScrollPosition]',
  standalone: true,
})
export class RestoreScrollPositionDirective implements AfterViewInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.router.lastSuccessfulNavigation()?.previousNavigation) return;
    if (!this.navigationTargetsProjectsSection()) return;

    // setTimeout(0) queues as a macrotask, ensuring it runs after Angular's
    // scrollPositionRestoration has already fired — which wins over rAF on mobile.
    setTimeout(() => {
      this.el.nativeElement.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, 0);
  }

  /** Only scroll when the user chose a link to `/#projects-section` (e.g. back from /projects). */
  private navigationTargetsProjectsSection(): boolean {
    if (typeof location !== 'undefined' && location.hash === `#${PROJECTS_SECTION_FRAGMENT}`) {
      return true;
    }

    const nav = this.router.lastSuccessfulNavigation();
    const extras = nav?.extras as { fragment?: string } | undefined;
    if (extras?.fragment === PROJECTS_SECTION_FRAGMENT) return true;

    try {
      const tree = this.router.parseUrl(this.router.url);
      if (tree.fragment === PROJECTS_SECTION_FRAGMENT) return true;
    } catch {
      /* ignore */
    }

    return false;
  }
}
