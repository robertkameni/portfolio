import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

type ProfileState = {
  data: any | null;
  isLoading: boolean;
};

const initialState: ProfileState = {
  data: null,
  isLoading: false,
};

export const PortfolioStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    loadProfile: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() => http.get('/api/v1/profile').pipe(
          tap((data) => patchState(store, { data, isLoading: false }))
        ))
      )
    )
  }))
);