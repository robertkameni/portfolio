import { PLATFORM_ID, Service, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { REQUEST } from '@analogjs/router/tokens';
import type { IncomingMessage } from 'node:http';
import { resolveBrowserLocale, resolveLocaleFromAcceptLanguage, type AppLocale } from '../i18n/app-locale';
import { getSiteCopy } from '../i18n/site-copy';

@Service()
export class LocaleService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly clientReady = isPlatformBrowser(this.platformId);
  private readonly request = inject(REQUEST, { optional: true }) as IncomingMessage | null;
  /**
   * The server used to hardcode `'en'`, so SSR rendered the English copy while
   * the browser rendered German: the language changed under the reader and a
   * crawler indexed the English text. The server now reads `Accept-Language`,
   * the same signal the browser uses, so the first paint is already in the
   * visitor's language. Responses are not shared between visitors
   * (`max-age=0, must-revalidate`), so one language per response is safe, and
   * the middleware adds `Vary: Accept-Language` so no intermediary caches it
   * wrongly.
   */
  private readonly localeState = signal<AppLocale>(this.clientReady ? resolveBrowserLocale() : resolveLocaleFromAcceptLanguage(this.request?.headers['accept-language']));

  readonly locale = this.localeState.asReadonly();
  readonly copy = computed(() => getSiteCopy(this.locale()));
}
