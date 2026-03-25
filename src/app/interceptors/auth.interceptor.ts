import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (req.url.startsWith('/api/admin')) {
    const accessToken = authService.accessToken();
    if (accessToken) {
      return next(
        req.clone({
          headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
        })
      );
    }
  }
  return next(req);
};
