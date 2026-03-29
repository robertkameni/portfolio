import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../../services/auth.service';
import {FadeInDirective} from '../../../shared/directives/fade-in.directive';

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
  template: `
    <div fadeIn class="flex items-center justify-center min-h-screen bg-gray-900 relative z-10001">
      <div class="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 class="text-2xl font-bold text-center text-white">Admin Login</h1>
        <form (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300">Email</label>
            <input type="email" [(ngModel)]="email" name="email" required
                   class="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300">Password</label>
            <input type="password" [(ngModel)]="password" name="password" required
                   class="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"/>
          </div>
          @if (errorMessage()) {
            <p class="text-sm text-center text-red-400">{{ errorMessage() }}</p>
          }
          <button type="submit" [disabled]="isLoading()"
                  class="w-full px-4 py-2 mt-6 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
            {{ isLoading() ? 'Logging in...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Toast -->
    @if (toastMessage()) {
      <div role="status" aria-live="polite" class="fixed bottom-6 right-6 z-10002">
        <div class="px-4 py-2 bg-yellow-600 text-white rounded-md shadow">{{ toastMessage() }}</div>
      </div>
    }
  `
})
export default class LoginPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  toastMessage = signal<string | null>(null);
  private readonly returnUrl = resolveReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl, {replaceUrl: true});
    }
  }

  submit(): void {
    if (this.isLoading() || !this.email || !this.password) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.login({email: this.email, password: this.password}).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl),
      error: (err) => {
        this.isLoading.set(false);
        if ((err as { status?: number }).status === 403) {
          this.errorMessage.set('Zugriff verweigert: Nur Admins.');
          this.showToast('Nur Administratoren können sich im Portfolio anmelden. Bitte kontaktieren Sie den Seiteninhaber, falls nötig.');
        } else {
          this.errorMessage.set(err.error?.statusMessage || 'Invalid credentials.');
        }
      },
      complete: () => this.isLoading.set(false)
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
