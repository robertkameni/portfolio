import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url.startsWith('/api/admin')) {
      const accessToken = this.authService.accessToken();

      if (accessToken) {
        const cloned = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
        });
        return next.handle(cloned);
      }
    }
    return next.handle(req);
  }
}
