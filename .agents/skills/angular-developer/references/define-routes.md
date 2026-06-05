# Define Routes

> **Angular 22:** See `isActive()` in [navigate-to-routes.md](navigate-to-routes.md) and [angular-22.md](angular-22.md).

Routes are objects that define which component should render for a specific URL path.

## Basic Configuration

Define routes in a `Routes` array and provide them using `provideRouter` in your `appConfig`.

```ts
// app.routes.ts
export const routes: Routes = [
  {path: '', component: HomePage},
  {path: 'admin', component: AdminPage},
];

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
```

## URL Paths

- **Static**: Matches an exact string (e.g., `'admin'`).
- **Route Parameters**: Dynamic segments prefixed with a colon (e.g., `'user/:id'`).
- **Wildcard**: Matches any URL using `**`. Useful for "Not Found" pages. **Always place at the end of the array.** Since Angular 21.1, wildcards may include surrounding segments (e.g. `'shell/**/child'`).

## Matching Strategy

Angular uses a **first-match wins** strategy. Specific routes must come before less specific ones.

## Redirects

Use `redirectTo` to point one path to another.

```ts
{ path: 'articles', redirectTo: '/blog' },
{ path: 'blog', component: Blog },
```

## Page Titles

Associate titles with routes for accessibility. Titles can be static or dynamic (via `ResolveFn` or a custom `TitleStrategy`).

```ts
{ path: 'home', component: Home, title: 'Home Page' }
```

## Route Data and Providers

- **Static Data**: Attach metadata using the `data` property.
- **Route Providers**: Scope dependencies to a specific route and its children using the `providers` array. With `withExperimentalAutoCleanupInjectors()` (21.1+, experimental), route-scoped services are destroyed when leaving the route.

```ts
import { provideRouter, withExperimentalAutoCleanupInjectors } from '@angular/router';

provideRouter(routes, withExperimentalAutoCleanupInjectors());
```

## Nested (Child) Routes

Define sub-views using the `children` property. Parent components must include a `<router-outlet />`.

```ts
{
  path: 'product/:id',
  component: Product,
  children: [
    { path: 'info', component: ProductInfo },
    { path: 'reviews', component: ProductReviews },
  ],
}
```
