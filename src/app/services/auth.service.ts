import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap, finalize } from 'rxjs/operators';
import type { User } from '../shared/types/user.types';
import type { ApiAck, ApiSuccess } from '../shared/types/api.types';

interface AuthPayload {
  user: User;
  accessToken: string;
}

type AuthResponse = ApiSuccess<AuthPayload>;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  #currentUser = signal<User | null>(null);
  #accessToken = signal<string | null>(null);
  #authInitialized = signal(false);
  #initialAuthStatus$?: Observable<User | null>;

  public readonly isAuthenticated = computed(() => !!this.#currentUser());
  public readonly isAdmin = computed(() => this.#currentUser()?.role === 'ADMIN');
  public readonly authInitialized = this.#authInitialized.asReadonly();
  public readonly accessToken = this.#accessToken.asReadonly();

  checkInitialAuthStatus(): Observable<User | null> {
    if (!this.#initialAuthStatus$) {
      if (!isPlatformBrowser(this.platformId)) {
        this.#currentUser.set(null);
        this.#authInitialized.set(true);
        this.#initialAuthStatus$ = of(null).pipe(shareReplay({ bufferSize: 1, refCount: false }));
        return this.#initialAuthStatus$;
      }

      try {
        const cookie = document.cookie || '';
        const hasAuthHint = cookie.includes('auth_hint=1');
        if (!hasAuthHint) {
          this.#currentUser.set(null);
          this.#authInitialized.set(true);
          this.#initialAuthStatus$ = of(null).pipe(shareReplay({ bufferSize: 1, refCount: false }));
          return this.#initialAuthStatus$;
        }
      } catch {
        this.#currentUser.set(null);
        this.#authInitialized.set(true);
        this.#initialAuthStatus$ = of(null).pipe(shareReplay({ bufferSize: 1, refCount: false }));
        return this.#initialAuthStatus$;
      }

      this.#initialAuthStatus$ = this.http.get<ApiSuccess<User>>('/api/auth/me').pipe(
        map((response) => response.data),
        tap((user) => this.#currentUser.set(user)),
        catchError((error) => {
          if ((error as { status?: number }).status === 401) {
            return this.refreshSession();
          }
          this.#currentUser.set(null);
          return of(null);
        }),
        finalize(() => this.#authInitialized.set(true)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.#initialAuthStatus$;
  }

  private refreshSession(): Observable<User | null> {
    return this.http.post<AuthResponse>('/api/auth/refresh', {}).pipe(
      tap((response) => {
        this.#accessToken.set(response.data.accessToken);
        this.#currentUser.set(response.data.user);
      }),
      map((response) => response.data.user),
      catchError((error) => {
        console.error('[AuthService] refreshSession error', error);
        this.#currentUser.set(null);
        this.#accessToken.set(null);
        return of(null);
      }),
    );
  }

  login(credentials: { email: string; password: string }): Observable<User> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap((response) => this.#accessToken.set(response.data.accessToken)),
      map((response) => response.data.user),
      tap((user) => this.#currentUser.set(user)),
    );
  }

  logout(): Observable<ApiAck> {
    return this.http.post<ApiAck>('/api/auth/logout', {}).pipe(
      tap(() => {
        this.#currentUser.set(null);
        this.#accessToken.set(null);
        this.#initialAuthStatus$ = undefined;
        this.router.navigateByUrl('/admin/login');
      }),
      catchError((err) => {
        // Even if logout fails on server, clear user on client
        this.#currentUser.set(null);
        this.#accessToken.set(null);
        this.#initialAuthStatus$ = undefined;
        this.router.navigateByUrl('/admin/login');
        throw err;
      }),
    );
  }
}
