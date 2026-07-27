import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { extractApiErrorMessage } from '../../../shared/utils/api-error.util';
import { FadeInDirective } from '../../../shared/directives/fade-in.directive';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import { LocaleService } from '../../../shared/services/locale.service';
import { withRenderMode } from '../../../shared/routing/render-mode.types';

export const routeMeta = withRenderMode('client');

function resolveReturnUrl(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/admin/projects';
  }

  return value;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, FadeInDirective],
  templateUrl: './index.page.html',
})
export default class LoginPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly localeService = inject(LocaleService);
  protected locale = this.localeService.locale;
  protected copy = computed(() => getSiteCopy(this.locale()));

  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  toastMessage = signal<string | null>(null);
  private readonly returnUrl = resolveReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
    }
  }

  submit(): void {
    if (this.isLoading() || !this.email || !this.password) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl),
      error: (err) => {
        this.isLoading.set(false);
        if ((err as { status?: number }).status === 403) {
          this.errorMessage.set(this.copy().adminLogin.accessDenied);
          this.showToast(this.copy().adminLogin.accessDeniedToast);
        } else {
          this.errorMessage.set(extractApiErrorMessage(err, this.copy().adminLogin.invalidCredentials));
        }
      },
      complete: () => this.isLoading.set(false),
    });
  }

  private showToast(message: string) {
    this.toastMessage.set(message);
    const handle = window.setTimeout(() => {
      this.toastMessage.set(null);
      window.clearTimeout(handle);
    }, 4000);
  }
}
