# Rendering Strategies

Angular supports multiple rendering strategies to optimize for SEO, performance, and interactivity.

## 1. Client-Side Rendering (CSR)

**Default Strategy.** Content is rendered entirely in the browser.

- **Use case**: Interactive dashboards, internal tools.
- **Pros**: Simplest to configure, low server cost.
- **Cons**: Poor SEO, slower initial content visibility (must wait for JS).

## 2. Static Site Generation (SSG / Prerendering)

Content is pre-rendered into static HTML files at **build time**.

- **Use case**: Marketing pages, blogs, documentation.
- **Pros**: Fastest initial load, excellent SEO, CDN-friendly.
- **Cons**: Requires rebuild for content updates, not for user-specific data.

## 3. Server-Side Rendering (SSR)

Content is rendered on the server for the **initial request**. Subsequent navigations happen client-side (SPA style).

- **Use case**: E-commerce product pages, news sites, personalized dynamic content.
- **Pros**: Excellent SEO, fast initial content visibility.
- **Cons**: Requires a server (Node.js), higher server cost/latency.

## Hydration

Hydration is the process of making server-rendered HTML interactive in the browser.

- **Incremental Hydration** (default in Angular 22): Enabled automatically by `provideClientHydration()`. `@defer` blocks hydrate as they become relevant.
- **Event Replay**: Captures and replays user events that happened before hydration finished.

Opt out of incremental hydration:

```ts
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';

provideClientHydration(withNoIncrementalHydration(), withEventReplay());
```

`httpResource` data prefetched on the server is replayed via HTTP transfer state on the client.

## Decision Matrix

| Requirement                     | Strategy             |
| :------------------------------ | :------------------- |
| **SEO + Static Content**        | SSG                  |
| **SEO + Dynamic Content**       | SSR                  |
| **No SEO + High Interactivity** | CSR                  |
| **Mixed**                       | Hybrid (Route-based) |
