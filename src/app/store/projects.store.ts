import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { patchState, signalStore, signalStoreFeature, type, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, pipe, tap } from 'rxjs';
import type { Project, ProjectListItem } from '../shared/types/project.types';
import type { ApiSuccess } from '../shared/types/api.types';

type ProjectsState = {
  data: ProjectListItem[] | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: ProjectsState = {
  data: null,
  isLoading: false,
  error: null,
};

const PROJECTS_STATE_KEY = makeStateKey<ProjectListItem[]>('projects.list');

function withProjectsLoad(url: string, browserOnly = false, useTransferState = false) {
  return signalStoreFeature(
    { state: type<ProjectsState>() },
    withMethods((store, http = inject(HttpClient), platformId = inject(PLATFORM_ID), transferState = inject(TransferState)) => ({
      load: rxMethod<void>(
        pipe(
          tap(() => {
            if (browserOnly && !isPlatformBrowser(platformId)) {
              return;
            }

            if (store.data() === null) {
              patchState(store, { isLoading: true, error: null });
            }
          }),
          exhaustMap(() => {
            if (browserOnly && !isPlatformBrowser(platformId)) {
              return EMPTY;
            }

            if (store.data() !== null) {
              return EMPTY;
            }

            if (useTransferState && isPlatformBrowser(platformId)) {
              const transferred = transferState.get(PROJECTS_STATE_KEY, null);
              if (transferred) {
                transferState.remove(PROJECTS_STATE_KEY);
                patchState(store, { data: transferred, isLoading: false, error: null });
                return EMPTY;
              }
            }

            return http.get<ApiSuccess<ProjectListItem[]>>(url).pipe(
              tap((res) => {
                if (useTransferState && !isPlatformBrowser(platformId)) {
                  transferState.set(PROJECTS_STATE_KEY, res.data);
                }
                patchState(store, { data: res.data, isLoading: false, error: null });
              }),
              catchError(() => {
                patchState(store, { isLoading: false, error: 'Failed to load projects.' });
                return EMPTY;
              }),
            );
          }),
        ),
      ),
    })),
  );
}

export const ProjectsStore = signalStore({ providedIn: 'root' }, withState(initialState), withProjectsLoad('/api/projects', false, true));

export const AdminProjectsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withProjectsLoad('/api/admin/projects', true),
  withMethods((store) => ({
    addProject(project: Project): void {
      const { contentMarkdown: _cm, ...listItem } = project;
      patchState(store, { data: [listItem, ...(store.data() ?? [])] });
    },
    removeProject(id: string): void {
      patchState(store, { data: (store.data() ?? []).filter((p) => p.id !== id) });
    },
  })),
);
