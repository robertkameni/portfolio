import { Component, inject, isDevMode, input } from '@angular/core';
import { Router } from '@angular/router';
import { FadeInDirective } from '../../directives/fade-in.directive';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'dev-proxy-bar',
  standalone: true,
  imports: [FadeInDirective],
  templateUrl: './dev-proxy-bar.html',
})
export class DevProxyBar {
  private readonly localeService = inject(LocaleService);

  backUrl = input<string | null>(null);
  homeUrl = input<string | null>(null);

  protected locale = this.localeService.locale;
  protected copy = this.localeService.copy;
  protected readonly devLabel = isDevMode() ? 'DEV-VORSCHAU' : this.copy().devProxy.label;

  constructor(private router: Router) {}

  showBackUrl() {
    return !!this.backUrl();
  }

  showHomeUrl() {
    return !!this.homeUrl();
  }

  navigateBack() {
    const url = this.backUrl();
    if (url) {
      this.router.navigate([url]);
    }
  }

  navigateHome() {
    const url = this.homeUrl();
    if (url) {
      this.router.navigate([url]);
    }
  }
}
