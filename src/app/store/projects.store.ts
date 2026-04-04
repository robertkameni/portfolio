import { inject, PLATFORM_ID } from '@angular/core';
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

function withProjectsLoad(url: string, browserOnly = false) {
  return signalStoreFeature(
    { state: type<ProjectsState>() },
    withMethods((store, http = inject(HttpClient), platformId = inject(PLATFORM_ID)) => ({
      load: rxMethod<void>(
        pipe(
          exhaustMap(() => {
            if ((browserOnly && !isPlatformBrowser(platformId)) || store.data() !== null) {
              return EMPTY;
            }
            patchState(store, { isLoading: true, error: null });
            return http.get<ApiSuccess<ProjectListItem[]>>(url).pipe(
              tap((res) => patchState(store, { data: res.data, isLoading: false })),
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

export const ProjectsStore = signalStore({ providedIn: 'root' }, withState(initialState), withProjectsLoad('/api/projects'));

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
