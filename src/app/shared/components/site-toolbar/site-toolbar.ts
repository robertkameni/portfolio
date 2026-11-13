import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'site-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './site-toolbar.html',
  host: {
    class: 'sticky top-0 z-40 block w-full',
  },
})
export class SiteToolbarComponent {
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);

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

  goHome() {
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
