import { ViewportScroller } from '@angular/common';
import { afterNextRender, Component, DestroyRef, ElementRef, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'site-toolbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-toolbar.html',
  host: {
    class: 'sticky top-0 z-40 block w-full',
  },
})
export class SiteToolbarComponent {
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly scroller = inject(ViewportScroller);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private resizeObserver: ResizeObserver | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const apply = () => {
        const height = this.host.nativeElement.offsetHeight;
        document.documentElement.style.setProperty('--header-offset', `${height}px`);
        this.scroller.setOffset([0, height]);
      };
      apply();

      const fragment = this.router.parseUrl(this.router.url).fragment;
      if (fragment) {
        // The browser scrolled to the fragment before this measurement existed,
        // using the CSS fallback; Angular skips its own anchor scroll while
        // hydrating. Re-run it now that the real offset is known. `scrollToAnchor`
        // applies `setOffset`, and is a no-op if the target is not in the DOM yet.
        this.scroller.scrollToAnchor(fragment);
      }

      // Registered inside the render callback, so teardown only ever exists in
      // the browser. `ngOnDestroy` would run during server rendering too, where
      // `document` is not defined and touching it throws. It goes before the
      // ResizeObserver guard: a browser without the observer still measured the
      // header, and must still give the variable back on teardown.
      this.destroyRef.onDestroy(() => {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        document.documentElement.style.removeProperty('--header-offset');
      });

      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      this.resizeObserver = new ResizeObserver(apply);
      this.resizeObserver.observe(this.host.nativeElement);
    });
  }

  readonly auth = inject(AuthService);

  backUrl = input<string | null>(null);
  homeUrl = input<string | null>(null);

  protected locale = this.localeService.locale;
  protected copy = this.localeService.copy;

  showBackUrl() {
    return !!this.backUrl();
  }

  showHomeUrl() {
    return !!this.homeUrl();
  }

  navigateBack() {
    const url = this.backUrl();
    if (url) {
      void this.router.navigate([url]);
    }
  }

  navigateHome() {
    const url = this.homeUrl();
    if (url) {
      void this.router.navigate([url]);
      return;
    }
    void this.router.navigateByUrl('/');
  }

  openAdmin() {
    if (this.auth.isAuthenticated() && this.auth.isAdmin()) {
      void this.router.navigateByUrl('/admin');
      return;
    }
    void this.router.navigateByUrl('/admin/login');
  }
}
