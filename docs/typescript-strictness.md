# TypeScript strictness adoption

## `noUncheckedIndexedAccess`

Enabled for **`src/server/**`** via `tsconfig.server.json` (extends base `tsconfig.json`).

The frontend app (`tsconfig.app.json`) and specs (`tsconfig.spec.json`) remain on the base config without this flag for now — adopt there in a follow-up once server coverage is stable.

Run server-only checks:

```bash
npx tsc -p tsconfig.server.json --noEmit
```

Full project typecheck (app + spec + server):

```bash
npm run typecheck
```
