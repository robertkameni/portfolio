import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import type { User } from '../shared/types/user.types';

interface LoginResponse {
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  #accessToken = signal<string | null>(null);
  #currentUser = signal<User | null>(null);

  public readonly currentUser = this.#currentUser.asReadonly();
  public readonly accessToken = this.#accessToken.asReadonly();
  public readonly isAuthenticated = computed(() => !!this.#accessToken());

  login(credentials: { email: string; password: string }): Observable<void> {
    return this.http.post<LoginResponse>('/api/auth/login', credentials).pipe(
      tap((response) => {
        this.#accessToken.set(response.accessToken);
        const decodedUser = this.decodeToken(response.accessToken);
        if (decodedUser) {
          this.#currentUser.set({
            id: decodedUser.userId,
            email: 'admin@example.com', // Placeholder
            role: 'ADMIN',
            createdAt: new Date(decodedUser.iat * 1000).toISOString(),
          });
        }
      }),
      map(() => void 0),
      catchError((error) => {
        this.logout();
        throw error;
      })
    );
  }

  logout(): void {
    this.#accessToken.set(null);
    this.#currentUser.set(null);
    this.router.navigateByUrl('/admin/login');
  }

  private decodeToken(token: string): { userId: string; iat: number; exp: number } | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  }
}
