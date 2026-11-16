import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { type LocalizedProfileData } from '../shared/types/profile-data';
import { LocaleService } from '../shared/services/locale.service';
import type { AppLocale } from '../shared/i18n/app-locale';

type ProfileState = {
  data: LocalizedProfileData | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number;
  lastFetchedLocale: AppLocale | null;
};

const initialState: ProfileState = {
  data: null,
  isLoading: false,
  error: null,
  lastFetchedAt: 0,
  lastFetchedLocale: null,
};

export const CLIENT_CACHE_TTL_MS = 300_000; // 5 minutes

function profileStateKey(locale: AppLocale) {
  return makeStateKey<LocalizedProfileData>(`portfolio.profile.${locale}`);
}

/**
 * Hydration compares the server-rendered DOM against the client's first render.
 * Starting at `initialState` means that first render is `data() === null`, which
 * does not match the HTML the server sent (it rendered the profile), so Angular
 * discards the server tree and renders again. On a phone that second render is
 * what the visitor sees as LCP: the bytes were already painted, then everything
 * was recreated and the entrance animations ran a second time.
 *
 * Reading the transfer state here — during store creation, before the template
 * hydrates — makes the first client render identical to the server's.
 */
function initialProfileState(): ProfileState {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return initialState;
  }

  const locale = inject(LocaleService).locale();
  const transferState = inject(TransferState);
  const key = profileStateKey(locale);
  const transferred = transferState.get(key, null);

  if (!transferred) {
    return initialState;
  }

  transferState.remove(key);
  return {
    data: transferred,
    isLoading: false,
    error: null,
    /* The data is server-fresh. Stamping it as fetched now lets the TTL in
       `loadProfile` treat it as current instead of refetching immediately. */
    lastFetchedAt: Date.now(),
    lastFetchedLocale: locale,
  };
}

export const PortfolioStore = signalStore(
  { providedIn: 'root' },
  withState(initialProfileState),
  withMethods((store, http = inject(HttpClient), platformId = inject(PLATFORM_ID), localeService = inject(LocaleService), transferState = inject(TransferState)) => {
    return {
      loadProfile: rxMethod<void>(
        pipe(
          tap(() => {
            const currentData = store.data();
            const desiredLocale = localeService.locale();
            const shouldFetch = !currentData || currentData.locale !== desiredLocale;

            if (shouldFetch) {
              patchState(store, { isLoading: !currentData, error: null });
            }
          }),
          switchMap(() => {
            const currentData = store.data();
            const desiredLocale = localeService.locale();
            const lastFetchedAt = store.lastFetchedAt();
            const lastFetchedLocale = store.lastFetchedLocale();
            const cacheStillFresh = isPlatformBrowser(platformId) && lastFetchedLocale === desiredLocale && lastFetchedAt > 0 && Date.now() - lastFetchedAt < CLIENT_CACHE_TTL_MS;

            if (currentData && currentData.locale === desiredLocale && cacheStillFresh) {
              patchState(store, { isLoading: false, error: null });
              return EMPTY;
            }

            const stateKey = profileStateKey(desiredLocale);

            if (isPlatformBrowser(platformId)) {
              const transferred = transferState.get(stateKey, null);
              if (transferred) {
                transferState.remove(stateKey);
                patchState(store, { data: transferred, isLoading: false, error: null });
                return EMPTY;
              }
            }

            const profileUrl = `/api/v1/profile?locale=${desiredLocale}`;

            return http.get<LocalizedProfileData>(profileUrl).pipe(
              tap((data) => {
                if (!isPlatformBrowser(platformId)) {
                  transferState.set(stateKey, data);
                }
                patchState(store, {
                  data,
                  isLoading: false,
                  error: null,
                  lastFetchedAt: Date.now(),
                  lastFetchedLocale: desiredLocale,
                });
              }),
              catchError((error) => {
                const msg = error instanceof Error ? error.message : ((error as { message?: string })?.message ?? String(error));
                console.error('[PortfolioStore] fetch failed:', msg);
                patchState(store, { isLoading: false, error: 'Failed to load profile.' });
                return EMPTY;
              }),
            );
          }),
        ),
      ),
    };
  }),
);
