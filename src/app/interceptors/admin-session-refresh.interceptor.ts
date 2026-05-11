import { HttpBackend, HttpClient, HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

/** Prevents infinite 401 → refresh loops on a single request chain. */
const ADMIN_SESSION_REFRESH_RETRIED = new HttpContextToken<boolean>(() => false);

function isAdminApiUrl(url: string): boolean {
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0] ?? '';
    return path.startsWith('/api/admin');
  } catch {
    return false;
  }
}

/**
 * When the access cookie is missing/expired, `/api/admin/*` returns 401 while `refreshToken` may still be valid.
 * Refresh once via HttpBackend (no interceptors), then retry the original admin request.
 */
export const adminSessionRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const backend = inject(HttpBackend);

  if (!isAdminApiUrl(req.url) || req.context.get(ADMIN_SESSION_REFRESH_RETRIED)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const bareClient = new HttpClient(backend);
      return bareClient.post<unknown>('/api/auth/refresh', {}).pipe(
        switchMap(() =>
          next(
            req.clone({
              context: req.context.set(ADMIN_SESSION_REFRESH_RETRIED, true),
            }),
          ),
        ),
      );
    }),
  );
};
