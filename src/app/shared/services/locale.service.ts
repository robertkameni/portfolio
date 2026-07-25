import { Service, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { resolveBrowserLocale, type AppLocale } from '../i18n/app-locale';
import { getSiteCopy } from '../i18n/site-copy';

@Service()
export class LocaleService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly clientReady = isPlatformBrowser(this.platformId);
  private readonly localeState = signal<AppLocale>(this.clientReady ? resolveBrowserLocale() : 'en');

  readonly locale = this.localeState.asReadonly();
  readonly copy = computed(() => getSiteCopy(this.locale()));
}
