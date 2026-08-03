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

## Code-splitting verification (Aug 2026)

### Deferred (lazy) chunks

| Chunk | Size (raw) | Size (gzip) | Trigger |
| --- | --- | --- | --- |
| `ai-engine-CCgSfgWF.js` | 9.60 kB | 3.65 kB | `@defer (on interaction)` — chat launcher button |
| `marked.esm-DjCow6Jh.js` | 41.45 kB | 12.44 kB | `@defer` — project detail markdown parser, via `afterNextRender` |

Both are emitted as separate chunks (not bundled into any page route chunk). The `ai-engine-*` pattern is recognized by `scripts/check-bundle-budgets.mjs` as a lazy route chunk, so it does not count toward the initial payload budget.

### Home page route chunks (static imports)

Components imported in `Home.imports[]` (SkillsBento, Hero, About, ProjectsSection, Contact, Footer) are Vite-split into their own chunks:
- `skills-bento-*.js` (2.05 kB raw)
- `about-*.js` (4.62 kB raw)
- `contact-*.js` (7.58 kB raw)
- `projects-section-*.js` (3.29 kB raw)
- `projects-list-*.js` (4.72 kB raw)

These are not defer-triggered — they load with the home page route, but Vite code-splits them from the core bundle.

### Chunks intentionally in the total initial payload budget

- `_debug_node-chunk-*.js` (~172 kB / ~57 kB gzip) — Angular 22 framework core (see above)
- `_router-chunk-*.js` (~80 kB / ~21 kB gzip) — Angular router framework
- `_module-chunk-*.js` (~54 kB / ~17 kB gzip) — Angular common module runtime
- `forms-*.js` (~52 kB / ~12 kB gzip) — Angular forms (used by contact form)
