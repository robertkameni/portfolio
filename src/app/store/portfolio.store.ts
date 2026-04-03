import {inject, PLATFORM_ID} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {isPlatformBrowser} from '@angular/common';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {catchError, EMPTY, pipe, switchMap, tap} from 'rxjs';
import type {IntroData} from '../pages/components/intro/interface/intro-data';
import type {SkillCard} from '../pages/components/hero/interface/skill-card';
import type {SkillBentoData} from '../pages/components/skills-bento/interface/skill-bento-data';
import type {AboutData} from '../pages/components/about/interface/about-data';
import type {ContactData} from '../pages/components/contact/interface/contact-data';
import {type AppLocale} from '../shared/i18n/app-locale';
import {LocaleService} from '../shared/services/locale.service';

export interface ProfileData {
  name: string;
  title: string;
  phone: string;
  email: string;
  intro: IntroData;
  heroCards: SkillCard[];
  skills: SkillBentoData[];
  about: AboutData;
  contact: ContactData;
}

export interface LocalizedProfileData extends ProfileData {
  locale: AppLocale;
}

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
            const currentData = store.data();
            const desiredLocale = isPlatformBrowser(platformId) ? localeService.locale() : currentData?.locale ?? 'en';

            const shouldFetch = !currentData || currentData.locale !== desiredLocale;

            if (shouldFetch) {
              patchState(store, {isLoading: !currentData, error: null});
            }
          }),
          switchMap(() => {
            const currentData = store.data();
            const desiredLocale = isPlatformBrowser(platformId) ? localeService.locale() : currentData?.locale ?? 'en';

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
