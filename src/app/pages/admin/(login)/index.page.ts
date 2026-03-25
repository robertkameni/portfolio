import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { form, required, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormField],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-900">
      <div class="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 class="text-2xl font-bold text-center text-white">Admin Login</h1>

        <form (submit)="submit($event)" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              [formField]="loginForm.email"
              class="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              id="password"
              [formField]="loginForm.password"
              class="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          @if (errorMessage()) {
            <p class="mt-4 text-sm text-center text-red-400">{{ errorMessage() }}</p>
          }

          <button
            type="submit"
            [disabled]="isLoading() || !loginForm().valid"
            class="w-full px-4 py-2 mt-6 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading() ? 'Logging in...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export default class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly isLoading = signal(false);
  public readonly errorMessage = signal<string | null>(null);

  formModel = signal({
    email: '',
    password: '',
  });

  loginForm = form(this.formModel, (schema) => {
    required(schema.email, { message: 'Email is required' });
    required(schema.password, { message: 'Password is required' });
  });

  submit(event: Event): void {
    event?.preventDefault();

    if (this.isLoading() || !this.loginForm().valid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = this.loginForm().value();

    this.authService.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.statusMessage || 'An unknown error occurred.');
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}
