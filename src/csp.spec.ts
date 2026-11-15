// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const vercelConfig = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));

type Header = { key: string; value: string };

function securityHeaders(): Header[] {
  const headers = vercelConfig?.headers ?? [];
  return headers.flatMap((entry: { headers?: Header[] }) => entry.headers ?? []);
}

function cspOf(key: string): string {
  const found = securityHeaders().find((header) => header.key === key);
  if (!found) throw new Error(`${key} header is missing from vercel.json`);
  return found.value;
}

function scriptHashes(csp: string): string[] {
  const directive = csp
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('script-src'));
  return (directive ?? '').match(/sha256-[A-Za-z0-9+/=]+/g) ?? [];
}

describe('Content Security Policy', () => {
  it('lists the same script hashes in the enforced and report-only headers', () => {
    // These drifted once: the enforced header carried a stale hash while the
    // report-only header carried the right one, so the console showed a blocked
    // inline script and a violation report at the same time.
    const enforced = scriptHashes(cspOf('Content-Security-Policy'));
    const reportOnly = scriptHashes(cspOf('Content-Security-Policy-Report-Only'));

    expect(enforced.length).toBeGreaterThan(0);
    expect(reportOnly).toEqual(enforced);
  });

  it('allows the inline scripts Angular injects, including each route variant', () => {
    // Angular emits three inline scripts. Two are payload-stable:
    //   1. id="ng-event-dispatch-contract" (event replay bootstrap)
    //   2. the untagged __jsaction_bootstrap call
    // `id="ng-state"` is `type="application/json"`, which CSP does not apply to,
    // so it needs no hash.
    //
    // The bootstrap call is NOT stable across routes: it lists the events that
    // page actually uses, so `/` ships ["click","submit"] and `/cv` ships
    // ["click"]. Hash-pinning that means every new route with a different event
    // set is silently blocked. The CV page was, until this list carried both.
    //
    // If a future route introduces a third event combination, the browser
    // console names the hash it needs. A per-request nonce would remove the
    // whole class of failure; this guard cannot detect it, because it reads
    // vercel.json rather than the served HTML.
    const hashes = scriptHashes(cspOf('Content-Security-Policy'));

    expect(hashes).toHaveLength(3);
  });

  it('keeps the report endpoint on the report-only policy', () => {
    expect(cspOf('Content-Security-Policy-Report-Only')).toContain('report-uri /api/csp-report');
  });

  it('allows no inline fonts', () => {
    // Together with assetsInlineLimit: 0 in vite.config.ts this keeps a subset
    // font from being inlined and then refused by this very directive.
    expect(cspOf('Content-Security-Policy')).toContain("font-src 'self'");
  });
});

describe('built stylesheets', () => {
  const assetsDir = join(root, 'dist/client/assets');

  it.skipIf(!existsSync(assetsDir))('never inline a font as a data URI', () => {
    const offenders = readdirSync(assetsDir)
      .filter((file) => file.endsWith('.css'))
      .filter((file) => readFileSync(join(assetsDir, file), 'utf8').includes('data:font'));

    // The CSP forbids it, so an inlined font is a blocked request and one
    // violation report per visitor, not a styling decision.
    expect(offenders).toEqual([]);
  });
});
