import { AfterViewInit, Directive, ElementRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

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

    // setTimeout(0) queues as a macrotask, ensuring it runs after Angular's
    // scrollPositionRestoration has already fired — which wins over rAF on mobile.
    setTimeout(() => {
      this.el.nativeElement.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, 0);
  }
}
