import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {Observable, of} from 'rxjs';
import {catchError, map, shareReplay, tap} from 'rxjs/operators';
import type {User} from '../shared/types/user.types';

interface LoginResponse {
  user: User;
  accessToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  #currentUser = signal<User | null>(null);
  #accessToken = signal<string | null>(null);
  #initialAuthStatus$?: Observable<User | null>;

  public readonly isAuthenticated = computed(() => !!this.#currentUser());
  public readonly accessToken = this.#accessToken.asReadonly();

  checkInitialAuthStatus(): Observable<User | null> {
    if (!this.#initialAuthStatus$) {
      this.#initialAuthStatus$ = this.http.get<User>('/api/auth/me').pipe(
        tap(user => this.#currentUser.set(user)),
        catchError((error) => {
          if ((error as { status?: number }).status === 401) {
            return this.refreshSession();
          }
          this.#currentUser.set(null);
          return of(null);
        }),
        shareReplay({bufferSize: 1, refCount: false})
      );
    }

    return this.#initialAuthStatus$;
  }

  private refreshSession(): Observable<User | null> {
    return this.http.post<LoginResponse>('/api/auth/refresh', {}).pipe(
      tap((response) => {
        this.#accessToken.set(response.accessToken);
        this.#currentUser.set(response.user);
      }),
      map(response => response.user),
      catchError((error) => {
        console.error('[AuthService] refreshSession error', error);
        this.#currentUser.set(null);
        this.#accessToken.set(null);
        return of(null);
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<User> {
    return this.http.post<LoginResponse>('/api/auth/login', credentials).pipe(
      tap(response => this.#accessToken.set(response.accessToken)),
      map(response => response.user),
      tap(user => this.#currentUser.set(user))
    );
  }

  logout(): Observable<any> {
    return this.http.post('/api/auth/logout', {}).pipe(
      tap(() => {
        this.#currentUser.set(null);
        this.#accessToken.set(null);
        this.#initialAuthStatus$ = undefined;
        this.router.navigateByUrl('/admin/login');
      }),
      catchError(err => {
        // Even if logout fails on server, clear user on client
        this.#currentUser.set(null);
        this.#accessToken.set(null);
        this.#initialAuthStatus$ = undefined;
        this.router.navigateByUrl('/admin/login');
        throw err;
      })
    );
  }
}
