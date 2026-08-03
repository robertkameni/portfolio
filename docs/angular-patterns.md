# Angular Patterns — Data Fetching

## Decision: `httpResource` for new GETs, `rxMethod` for mutations

Angular 22 stabilized `httpResource` and `resource`. For **new** async GET reads, prefer `httpResource` with signal-native loading/error states. Keep `rxMethod` + `HttpClient` (via SignalStore) at the HTTP boundary for mutations and pipelines that need cancelation or deduplication.

## When to use each

| Pattern | Use case | Example |
|---|---|---|
| `httpResource` | New GET endpoint; simple read with loading/error UI | `projectResource = httpResource<Project>(() => '/api/projects/123')` |
| `SignalStore` + `rxMethod` | Existing list stores; mutations (POST/PUT/DELETE); pipelines needing `switchMap`/`exhaustMap` | `loadProjects: rxMethod<void>(pipe(exhaustMap(() => http.get(...))))` |
| `HttpClient` directly | One-off form submits or auth calls | `authService.login(credentials).subscribe(...)` |

## `httpResource` example (recommended for new GETs)

```typescript
import { httpResource } from '@angular/common/http';
import type { Project } from './project.types';
import type { ApiSuccess } from './api.types';

@Component({ ... })
class ProjectDetailPage {
  private readonly slug = input.required<string>();

  projectResource = httpResource<ApiSuccess<Project>>(() =>
    `/api/projects/${this.slug()}`,
  );

  // Template: @if (projectResource.isLoading()) { ... }
  //           @else if (projectResource.error()) { ... }
  //           @else if (projectResource.value(); as res) { ... use res.data ... }
}
```

Signal-native states (`isLoading`, `error`, `value`) remove the need for manual `isLoading` / `error` signals.

## `rxMethod` example (for mutations or complex pipelines)

```typescript
import { signalStore, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, catchError, EMPTY, pipe, tap } from 'rxjs';

export const ProjectsStore = signalStore(
  withMethods((store, http = inject(HttpClient)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap(() =>
          http.get<ApiSuccess<Project[]>>('/api/projects').pipe(
            tap((res) => patchState(store, { data: res.data, isLoading: false })),
            catchError((error) => {
              console.error('[ProjectsStore] fetch failed:', (error as { message?: string })?.message ?? error);
              patchState(store, { isLoading: false, error: 'Failed to load projects.' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
```

`exhaustMap` ignores new emissions while a request is in flight — useful for list loads. Use `switchMap` when the latest emission must cancel previous (e.g., search-as-you-type).

## Existing stores: do NOT rewrite

`PortfolioStore` and `ProjectsStore` already use `rxMethod` + `HttpClient` — these are stable and correct. This guidance applies to **new features** only.

## Further reading

- [Angular 22 docs: `httpResource`](https://angular.dev/api/common/http/httpResource)
- [Angular 22 docs: `resource`](https://angular.dev/api/core/resource)
- [NgRx SignalStore: `rxMethod`](https://ngrx.io/guide/signals/signal-store)
