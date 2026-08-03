# TypeScript strictness adoption

## `noUncheckedIndexedAccess`

Enabled **globally** via `tsconfig.json` (app, specs, and server). The base config applies it to all compilation contexts.

Adoption history:

- **Server** (`tsconfig.server.json`): enabled first pass (P3-3 from first review). Zero additional errors.
- **App + specs** (P3-1 from second review): enabled by adding the flag to the base `tsconfig.json`. Only 2 errors surfaced — both in `chat.store.ts` (`messages[messages.length - 1]` → replaced with `messages.at(-1)` guard). Fixed in the same pass.

Run full project typecheck:

```bash
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npx tsc -p tsconfig.server.json --noEmit
npm run typecheck
```
