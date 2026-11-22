import { makeStateKey, PLATFORM_ID, Service, computed, inject, signal, TransferState } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { REQUEST } from '@analogjs/router/tokens';
import type { IncomingMessage } from 'node:http';
import { resolveBrowserLocale, resolveLocaleFromAcceptLanguage, type AppLocale } from '../i18n/app-locale';
import { getSiteCopy } from '../i18n/site-copy';

/** The locale the server rendered with. Fixed key: the value is the locale. */
const SSR_LOCALE_STATE_KEY = makeStateKey<AppLocale>('app.locale');

@Service()
export class LocaleService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly clientReady = isPlatformBrowser(this.platformId);
  private readonly request = inject(REQUEST, { optional: true }) as IncomingMessage | null;
  private readonly transferState = inject(TransferState);
  /**
   * The server used to hardcode `'en'`, so SSR rendered the English copy while
   * the browser rendered German: the language changed under the reader and a
   * crawler indexed the English text. The server now reads `Accept-Language`,
   * the same signal the browser uses, so the first paint is already in the
   * visitor's language. Responses are not shared between visitors
   * (`max-age=0, must-revalidate`), so one language per response is safe, and
   * the middleware adds `Vary: Accept-Language` so no intermediary caches it
   * wrongly.
   *
   * The client must not resolve the language a second time. `Accept-Language`
   * (what the server saw) and `navigator.languages` (what the browser reports)
   * disagree often enough — privacy settings, proxies, a non-default UI
   * language — and the disagreement is fatal: the server renders one language,
   * hydration renders another, and Angular throws the server DOM away. The
   * server therefore publishes its choice in the transfer state and the client
   * adopts it, so the hydrated tree is always the tree that was served.
   */
  private readonly localeState = signal<AppLocale>(this.initialLocale());

  /**
   * True when the language is the visitor's explicit choice rather than a
   * heuristic (`Accept-Language` / `navigator.languages`). Only then does the
   * URL keep `?lang=`: an automatic pick must not be frozen into every link,
   * but a choice made through the toggle (or a shared `?lang=` link) has to
   * survive in-app navigation, a refresh, and a copied URL.
   */
  private readonly explicitLocale = signal<boolean>(this.readExplicitLocale());

  readonly locale = this.localeState.asReadonly();
  readonly copy = computed(() => getSiteCopy(this.locale()));

  /**
   * Visitor-driven locale change after hydration. First paint still comes from
   * transfer state / `?lang=`; this only runs from an explicit UI control.
   */
  setLocale(locale: AppLocale): void {
    // Clicking the button for the already active language is still a choice:
    // persist it so later navigation keeps `?lang=` in the URL.
    this.explicitLocale.set(true);
    if (locale !== this.localeState()) {
      this.localeState.set(locale);
    }
    if (!this.clientReady || typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem('app-locale', locale);
    } catch {
      // Private mode / blocked storage must not break the toggle.
    }
    const url = new URL(window.location.href);
    url.searchParams.set('lang', locale);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }

  /**
   * Router navigation does not repeat query params, so moving between pages
   * dropped `?lang=` and the next refresh or copied URL fell back to
   * `Accept-Language`. Re-attach an explicit choice with `replaceState` so the
   * address bar stays shareable and history gains no extra entry. In-app
   * navigation is the only trigger; the automatic language heuristic is never
   * frozen into the URL.
   */
  syncLangQueryParam(): void {
    if (!this.clientReady || !this.explicitLocale() || typeof window === 'undefined') {
      return;
    }
    const locale = this.localeState();
    const url = new URL(window.location.href);
    if (url.searchParams.get('lang') === locale) {
      return;
    }
    url.searchParams.set('lang', locale);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }

  /**
   * A `?lang=` in the current address means the visitor (or whoever shared the
   * link) chose the language, so navigation keeps carrying it. The stored
   * preference is deliberately not enough: first paint comes from the server,
   * which cannot read `localStorage`, so appending `?lang=` for a stored value
   * would flip the language on the next refresh mid-visit.
   */
  private readExplicitLocale(): boolean {
    if (!this.clientReady || typeof window === 'undefined') {
      return false;
    }
    return this.extractLangParamFromWindow() !== null;
  }

  private initialLocale(): AppLocale {
    if (!this.clientReady) {
      // ?lang= query wins over Accept-Language so a shared link renders in the
      // requested language on the first SSR response.
      const langParam = this.extractLangParam(this.readRequestUrl());
      const locale = langParam ?? resolveLocaleFromAcceptLanguage(this.request?.headers['accept-language']);
      this.transferState.set(SSR_LOCALE_STATE_KEY, locale);
      return locale;
    }

    // The transfer state carries the server's choice (which may already reflect
    // ?lang=), so the hydrated tree matches the served HTML.  For pure client
    // loads (no SSR, e.g. dev server without prerender) fall back to ?lang=
    // before the browser-language heuristic.
    const tsLocale = this.transferState.get(SSR_LOCALE_STATE_KEY, null);
    if (tsLocale) return tsLocale;
    const langParam = this.extractLangParamFromWindow();
    return langParam ?? resolveBrowserLocale();
  }

  /**
   * The URL the visitor asked for. Nitro rewrites `req.url` to the SSR entry
   * (`/index.html`) before Angular runs, which drops the path and the query
   * string; only `originalUrl` still carries `?lang=`. Reading `url` alone made
   * every shared `?lang=` link render in `Accept-Language` instead, and the
   * client then corrected the URL after hydration.
   */
  private readRequestUrl(): string | undefined {
    const request = this.request as (IncomingMessage & { originalUrl?: string }) | null;
    return request?.originalUrl ?? request?.url;
  }

  /**
   * Extract a valid `lang` query-param value from a server-side request URL
   * (which is a path + optional query string, e.g. `/cv?lang=en`).
   */
  private extractLangParam(url: string | undefined): AppLocale | null {
    if (!url) return null;
    const qIdx = url.indexOf('?');
    if (qIdx === -1) return null;
    const params = new URLSearchParams(url.slice(qIdx + 1));
    const lang = params.get('lang');
    return lang === 'de' || lang === 'en' ? lang : null;
  }

  /**
   * Extract a valid `lang` query-param value from `window.location.search`
   * (browser-only, called only when `this.clientReady` is true).
   */
  private extractLangParamFromWindow(): AppLocale | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    return lang === 'de' || lang === 'en' ? lang : null;
  }
}
