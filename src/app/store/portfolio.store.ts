import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import type { IntroData } from '../pages/components/intro/interface/intro-data';
import type { SkillCard } from '../pages/components/hero/interface/skill-card';
import type { SkillBentoData } from '../pages/components/skills-bento/interface/skill-bento-data';
import type { AboutData } from '../pages/components/about/interface/about-data';
import type { ContactData } from '../pages/components/contact/interface/contact-data';
import type { AppLocale } from '../shared/i18n/app-locale';

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
  error: null,
};

export const PortfolioStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    loadProfile: rxMethod<void>(
      pipe(
        // Skip if data is already loaded.
        tap(() => {
          if (!store.data()) {
            patchState(store, { isLoading: true, error: null });
          }
        }),
        switchMap(() => {
          if (store.data()) return EMPTY;
          return http.get<LocalizedProfileData>('/api/v1/profile').pipe(
            tap((data) => patchState(store, { data, isLoading: false })),
            catchError(() => {
              patchState(store, { isLoading: false, error: 'Failed to load profile.' });
              return EMPTY;
            }),
          );
        }),
      ),
    ),
  })),
);
