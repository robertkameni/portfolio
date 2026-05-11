import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideFileRouter, requestContextInterceptor } from '@analogjs/router';
import { withComponentInputBinding, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { adminSessionRefreshInterceptor } from './interceptors/admin-session-refresh.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';
import { lastValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideFileRouter(
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([requestContextInterceptor, adminSessionRefreshInterceptor, authInterceptor]),
    ),
    provideClientHydration(withEventReplay()),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return lastValueFrom(authService.checkInitialAuthStatus().pipe(catchError(() => of(null))));
    }),
  ],
};
