# Bundle analysis notes

## `_debug_node-chunk` is production Angular runtime (not dev tooling)

The client chunk `_debug_node-chunk-*.js` (~172 kB raw / ~57 kB gzip) and its larger SSR sibling (~390 kB / ~88 kB gzip) are **not** dev-only bundles that can be removed. They are Rollup output from Angular’s official package file:

`node_modules/@angular/core/fesm2022/_debug_node-chunk.mjs`

Despite the name, this file contains essential `@angular/core` runtime used in every production app, including:

- Dependency injection, `ApplicationRef`, component/directive factories
- Template rendering (`ɵɵ*` instructions), control flow, defer blocks
- Zoneless change detection and signal integration
- Client hydration (`readHydrationInfo`, incremental hydration helpers)
- `DebugElement` / `DebugNode` (used by Angular DevTools APIs, bundled with core)

Nothing from this project’s application code (e.g. `site-toolbar`, mock profile buttons) appears in this chunk. Bundle visualization and grep of the built asset confirm it is Angular framework code only.

**Implication:** Do not attempt to tree-shake or exclude `_debug_node-chunk` without dropping Angular features. Treat it as part of the initial framework payload when reading budget reports.

## Misleading upstream chunk name

| Name | What it actually is |
|---|---|
| `_debug_node-chunk` | Angular 22 core runtime split (framework) — not dev-only |

Mock-profile controls on the home page are gated with `isDevMode()` and are tree-shaken from production builds.

## Useful commands

```bash
npm run build:analyze   # writes dist/stats.html (Rollup treemap)
npm run check:bundles   # CI gzip budgets after build
```
