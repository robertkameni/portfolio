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

  it('allows the two inline scripts Angular injects', () => {
    // 1. id="ng-event-dispatch-contract" (Angular's event dispatch bootstrap)
    // 2. the untagged __jsaction_bootstrap call appended by SSR
    // If Angular changes either payload, the hash must be recomputed from the
    // served HTML; the browser console names the required value.
    expect(scriptHashes(cspOf('Content-Security-Policy'))).toHaveLength(2);
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
