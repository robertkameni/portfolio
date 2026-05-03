import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { FadeInDirective } from '../../directives/fade-in.directive';
import { getSiteCopy } from '../../i18n/site-copy';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'dev-proxy-bar',
  standalone: true,
  imports: [FadeInDirective],
  templateUrl: './dev-proxy-bar.component.html',
})
export class DevProxyBarComponent {
  backUrl = input<string | null>(null);
  homeUrl = input<string | null>(null);
  private readonly localeService = inject(LocaleService);
  protected locale = this.localeService.locale;
  protected copy = computed(() => getSiteCopy(this.locale()));

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
