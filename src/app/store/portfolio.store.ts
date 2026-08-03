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

export const PortfolioStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
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
                const msg = error instanceof Error ? error.message : (error as { message?: string })?.message ?? String(error);
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
