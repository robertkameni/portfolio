import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';

export type Project = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  contentMarkdown: string | null;
  tags: string[];
  coverImageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProjectsState = {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
};

const initialState: ProjectsState = {
  projects: [],
  isLoading: false,
  error: null,
};

export const ProjectsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    loadPublished: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          http.get<Project[]>('/api/projects').pipe(
            tap((projects) => patchState(store, { projects, isLoading: false })),
            catchError((_err) => {
              patchState(store, { isLoading: false, error: 'Failed to load projects' });
              return EMPTY;
            })
          )
        )
      )
    ),

    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          http.get<Project[]>('/api/admin/projects').pipe(
            tap((projects) => patchState(store, { projects, isLoading: false })),
            catchError((_err) => {
              patchState(store, { isLoading: false, error: 'Failed to load projects' });
              return EMPTY;
            })
          )
        )
      )
    ),

    addProject(project: Project) {
      patchState(store, (state) => ({
        projects: [project, ...state.projects],
        error: null,
      }));
    },

    createProject: rxMethod<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>(
      pipe(
        switchMap((data) =>
          http.post<Project>('/api/admin/projects', data).pipe(
            tap((project) =>
              patchState(store, (state) => ({
                projects: [project, ...state.projects],
                error: null,
              }))
            ),
            catchError((err) => {
              const message = err?.error?.statusMessage || err?.message || 'Failed to create project';
              console.error('[ProjectsStore] createProject error:', err.status, message);
              patchState(store, { error: message });
              return EMPTY;
            })
          )
        )
      )
    ),
  }))
);

