import { computed, inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap, finalize } from 'rxjs/operators';
import type { User } from '../shared/types/user.types';
import type { ApiAck, ApiSuccess } from '../shared/types/api.types';

interface AuthPayload {
  user: User;
}

type LoginResponse = ApiSuccess<AuthPayload>;
type RefreshResponse = ApiSuccess<{ user: User }>;

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  #currentUser = signal<User | null>(null);
  #authInitialized = signal(false);
  #initialAuthStatus$?: Observable<User | null>;

  public readonly isAuthenticated = computed(() => !!this.#currentUser());
  public readonly isAdmin = computed(() => this.#currentUser()?.role === 'ADMIN');
  public readonly authInitialized = this.#authInitialized.asReadonly();

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

  private clearStaleAuthHintCookie(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const loc = typeof globalThis !== 'undefined' && 'location' in globalThis ? (globalThis as { location?: { protocol?: string } }).location : undefined;
      const securePart = loc?.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `auth_hint=; Path=/; Max-Age=0; SameSite=Strict${securePart}`;
    } catch {
      // ignore document access errors
    }
  }

  private refreshSession(): Observable<User | null> {
    return this.http.post<RefreshResponse>('/api/auth/refresh', {}).pipe(
      tap((response) => {
        this.#currentUser.set(response.data.user);
      }),
      map((response) => response.data.user),
      catchError((error) => {
        console.error('[AuthService] refreshSession error', error);
        this.clearStaleAuthHintCookie();
        this.#currentUser.set(null);
        return of(null);
      }),
    );
  }

  login(credentials: { email: string; password: string }): Observable<User> {
    return this.http.post<LoginResponse>('/api/auth/login', credentials).pipe(
      map((response) => response.data.user),
      tap((user) => this.#currentUser.set(user)),
    );
  }

  logout(): Observable<ApiAck> {
    return this.http.post<ApiAck>('/api/auth/logout', {}).pipe(
      tap(() => {
        this.#currentUser.set(null);
        this.#initialAuthStatus$ = undefined;
        this.router.navigateByUrl('/admin/login');
      }),
      catchError((err) => {
        // Even if logout fails on server, clear user on client
        this.#currentUser.set(null);
        this.#initialAuthStatus$ = undefined;
        this.router.navigateByUrl('/admin/login');
        throw err;
      }),
    );
  }
}
