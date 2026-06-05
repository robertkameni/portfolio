# Angular 22 — Stable Features Overview

This project targets **Angular 22**. Use this reference when choosing APIs, migrations, or patterns.

**Live source of truth:** Always fact-check against the **Angular CLI MCP server** in Cursor (`user-angular-cli`): `list_projects` → `get_best_practices` → `search_documentation` / `find_examples`. This file and other repo docs are orientation only.

Source: [Angular Architects — Angular 22 overview](https://www.angulararchitects.io/blog/angular-22-die-wichtigsten-neuen-features-im-ueberblick/) (June 2026).

## What became stable in Angular 22

| Area | Status in v22 | Key APIs |
| :--- | :--- | :--- |
| **Resource API** | Stable | `resource`, `rxResource`, `httpResource` |
| **Signal Forms** | Stable | `form`, `FormField`, `FormRoot`, `submit`, `validateStandardSchema` |
| **Incremental Hydration** | On by default | `provideClientHydration()`, `withNoIncrementalHydration()` |
| **Change detection** | `OnPush` is default | `ChangeDetectionStrategy.Eager` preserves legacy behavior |

## Change detection: OnPush is the default

New components use `OnPush` unless configured otherwise. `ChangeDetectionStrategy.Default` is deprecated; use `Eager` for the previous full-tree checking behavior.

`ng update` sets `Eager` on existing components that did not explicitly choose a strategy, avoiding silent behavior changes.

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager, // legacy full-tree checks
  template: `...`,
})
export class LegacyCmp {}
```

## Resource API (stable)

`resource`, `rxResource`, and `httpResource` are production-ready.

- Reactive reload when dependency signals change
- Race conditions handled (like `switchMap`)
- Status signals: `value`, `error`, `isLoading`, `status` (`idle` | `loading` | `reloading` | `error` | `resolved` | `local`)
- Return `undefined` from the loader to skip a request

See [resource.md](resource.md) for usage patterns.

### Resource composition (since 21.2)

Derive one resource from another via `snapshot` + `linkedSignal` + `resourceFromSnapshots` (e.g. filter loaded data, keep previous value while reloading).

### `debounced` (v22)

Delay signal or resource value updates without leaving the signal model:

```ts
import { debounced, signal } from '@angular/core';

const filter = signal('');
const debouncedFilter = debounced(filter, 300);
```

## Signal Forms (stable)

Prefer Signal Forms for new forms in this repo. Includes:

- **Submission API** — `submission: { action, ignoreValidators, onInvalid }` on `form()`
- **`FormRoot`** — bind `[formRoot]` on `<form>` for native validation suppression and submit wiring
- **`when` on field rules** — `disabled`, `readonly`, `hidden` use `{ when: (ctx) => ... }`
- **CSS status classes** — `provideSignalFormsConfig({ classes: ... })` or `NG_STATUS_CLASSES` from compat
- **Interop** — `compatForm`, `SignalFormControl` from `@angular/forms/signals/compat`
- **Dynamic schemas** — `validateStandardSchema(path, () => schema)` with Zod/Valibot

See [signal-forms.md](signal-forms.md).

## Dependency injection

### `@Service()` decorator (v22)

Ergonomic replacement for the common `@Injectable({ providedIn: 'root' })` case:

```ts
import { Service } from '@angular/core';

@Service()
export class FlightClient {}

@Service({ autoProvided: false })
export class TabRegistry {}
```

`@Injectable()` remains valid for non-default provider setups.

### `injectAsync` (v22)

Lazy-inject services (e.g. dynamic `import()` for code splitting):

```ts
import { injectAsync, onIdle } from '@angular/core';

private readonly upgradeService = injectAsync(
  () => import('./upgrade-service').then((m) => m.UpgradeService),
  { prefetch: onIdle },
);

protected async upgrade(): Promise<void> {
  const svc = await this.upgradeService();
  svc.upgrade(this.ticketId());
}
```

The lazy-loaded service must be auto-provided (`@Service()` or `providedIn: 'root'`).

## HttpClient: FetchBackend default (v22)

`HttpClient` uses `FetchBackend` by default. `withFetch()` is deprecated and can be removed.

- **Download progress**: `reportDownloadProgress: true` (works with Fetch)
- **Upload progress**: `reportUploadProgress: true` requires `provideHttpClient(withXhr())`
- `ng update` may add `withXhr()` automatically when upload progress is used

## SSR and hydration

`provideClientHydration()` enables **incremental hydration** by default. Opt out:

```ts
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';

provideClientHydration(withNoIncrementalHydration());
```

`httpResource` integrates with HTTP transfer state to avoid duplicate browser requests after SSR.

## Router

### `isActive()` signal (v22)

```ts
import { isActive, Router } from '@angular/router';

protected readonly flightSearchActive = isActive('/booking/flight-search', inject(Router));
protected readonly summaryActive = isActive('/booking/summary', inject(Router), { paths: 'exact' });
```

```html
<a routerLink="./flight-search" [class.active]="flightSearchActive()">Flight</a>
```

### Route injector cleanup (experimental, 21.1+)

`withExperimentalAutoCleanupInjectors()` destroys route-scoped providers when leaving the route.

### Wildcard routes (21.1+)

Trailing segments are allowed: `'foo/**/bar'`.

## Template syntax (21.1–22)

- Object/array spread and rest args in templates: `{ ...base, active: on() }`, `[...a, ...b]`, `sum(...nums())`
- `@switch` fall-through: multiple `@case` labels before one block
- Arrow functions in templates (implicit return only)
- `instanceof` in templates
- Exhaustive `@switch`: `@default never;` or `@default never(state);` for discriminated unions
- `?.` matches JavaScript semantics; use `$null(...)` for legacy Angular nullish behavior
- Truthiness checks narrow types in `@if` blocks
- `//` and `/* */` comments inside element opening tags

## `@defer`

Idle trigger with timeout (v22):

```html
@defer (on idle(2000)) {
  <heavy-widget />
}
```

## Toolchain

- **TypeScript 6** supported (5.9 dropped)
- **Node.js 26** officially supported

## Migrating to Angular 22

1. Run `ng update @angular/core@22 @angular/cli@22`
2. Review schematics output (change detection, HttpClient backend, hydration)
3. Prefer stable Resource API and Signal Forms for new code
4. Remove deprecated `withFetch()` if present
5. See [migrations.md](migrations.md) for schematic commands
