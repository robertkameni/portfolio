import {inject, PLATFORM_ID} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {isPlatformBrowser} from '@angular/common';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {catchError, EMPTY, pipe, switchMap, tap} from 'rxjs';
import {type LocalizedProfileData} from '../shared/types/profile-data';
import {LocaleService} from '../shared/services/locale.service';

type ProfileState = {
  data: LocalizedProfileData | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: ProfileState = {
  data: null,
  isLoading: false,
  error: null
};

export const PortfolioStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withMethods((
    store,
    http = inject(HttpClient),
    platformId = inject(PLATFORM_ID),
    localeService = inject(LocaleService)
  ) => {
    return {
      loadProfile: rxMethod<void>(
        pipe(
          tap(() => {
            if (!isPlatformBrowser(platformId)) return;

            const currentData = store.data();
            const desiredLocale = localeService.locale();
            const shouldFetch = !currentData || currentData.locale !== desiredLocale;

            if (shouldFetch) {
              patchState(store, {isLoading: !currentData, error: null});
            }
          }),
          switchMap(() => {
            if (!isPlatformBrowser(platformId)) {
              patchState(store, {isLoading: false});
              return EMPTY;
            }

            const currentData = store.data();
            const desiredLocale = localeService.locale();

            if (currentData && currentData.locale === desiredLocale) {
              return EMPTY;
            }

            const profileUrl = `/api/v1/profile?locale=${desiredLocale}`;

            return http.get<LocalizedProfileData>(profileUrl).pipe(
              tap((data) => patchState(store, {data, isLoading: false, error: null})),
              catchError(() => {
                patchState(store, {isLoading: false, error: 'Failed to load profile.'});
                return EMPTY;
              })
            );
          })
        )
      )
    };
  })
);
