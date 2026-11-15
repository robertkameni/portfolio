// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { buildContentSecurityPolicy, buildReportOnlyPolicy, EVENT_DISPATCH_CONTRACT_HASH, EVENT_DISPATCH_CONTRACT_PATH } from './server/utils/csp-policy';

const root = fileURLToPath(new URL('..', import.meta.url));
const vercelConfig = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));

type Header = { key: string; value: string };

function securityHeaders(): Header[] {
  const headers = vercelConfig?.headers ?? [];
  return headers.flatMap((entry: { headers?: Header[] }) => entry.headers ?? []);
}

const NONCE = 'dGVzdC1ub25jZS12YWx1ZQ==';
const enforced = buildContentSecurityPolicy({ nonce: NONCE });
const reportOnly = buildReportOnlyPolicy(NONCE);

function directive(policy: string, name: string): string {
  return (
    policy
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name} `)) ?? ''
  );
}

describe('Content Security Policy', () => {
  it('allows inline scripts by nonce, not by hash', () => {
    // The two inline scripts Angular emits during SSR are not payload-stable
    // across routes: the event-replay bootstrap lists the events a page uses,
    // so `/` ships ["click","submit"] and `/cv` ships ["click"]. Hash-pinning
    // that blocked every /cv visit and could not be caught by reading
    // vercel.json, because the hash only exists in the served HTML.
    const scriptSrc = directive(enforced, 'script-src');

    expect(scriptSrc).toContain(`'nonce-${NONCE}'`);
    expect(scriptSrc).toContain("'self'");
  });

  it('pins only the script Angular cannot stamp with the nonce', () => {
    // `ng-event-dispatch-contract` is injected into the app shell at build time
    // by the Analog Vite plugin, before SSR, so CSP_NONCE never reaches it. Its
    // content is a fixed file in the Angular package, so one hash is stable.
    // Recomputing it here means an Angular upgrade that changes the file fails
    // this test instead of silently blocking the script in production.
    const actual = `sha256-${createHash('sha256').update(readFileSync(EVENT_DISPATCH_CONTRACT_PATH)).digest('base64')}`;
    const withHash = buildContentSecurityPolicy({ nonce: NONCE, scriptHashes: [EVENT_DISPATCH_CONTRACT_HASH] });
    const scriptSrc = directive(withHash, 'script-src');

    expect(actual, 'EVENT_DISPATCH_CONTRACT_HASH is stale; an Angular upgrade changed the file').toBe(EVENT_DISPATCH_CONTRACT_HASH);
    expect(scriptSrc).toContain(`'${EVENT_DISPATCH_CONTRACT_HASH}'`);
    expect(scriptSrc).toContain(`'nonce-${NONCE}'`);
    // Exactly one hash: the payload-stable one. Anything else would be a
    // per-route hash creeping back in.
    expect(scriptSrc.match(/sha256-/g) ?? []).toHaveLength(1);
  });

  it('never pairs a nonce with unsafe-inline', () => {
    // A browser drops the nonce as soon as `'unsafe-inline'` is present, and the
    // policy silently degrades to allowing every inline script. The failure is
    // invisible: the page works, and the protection is gone.
    expect(directive(enforced, 'script-src')).not.toContain("'unsafe-inline'");
  });

  it('issues a different policy per response', () => {
    const a = buildContentSecurityPolicy({ nonce: 'bm9uY2UtYQ==' });
    const b = buildContentSecurityPolicy({ nonce: 'bm9uY2UtYg==' });

    expect(a).not.toBe(b);
  });

  it('keeps the report endpoint on the report-only policy only', () => {
    expect(reportOnly).toContain('report-uri /api/csp-report');
    expect(enforced).not.toContain('report-uri');
    // Everything else must be identical, or the report-only policy stops
    // predicting what the enforced one will block.
    expect(reportOnly.replace('; report-uri /api/csp-report', '')).toBe(enforced);
  });

  it('forbids inline fonts', () => {
    // Together with assetsInlineLimit: 0 in vite.config.ts this keeps a subset
    // font from being inlined and then refused by this very directive.
    expect(directive(enforced, 'font-src')).toBe("font-src 'self'");
  });

  it('keeps the directives the app depends on', () => {
    expect(directive(enforced, 'style-src')).toContain("'unsafe-inline'");
    expect(directive(enforced, 'img-src')).toContain('https://images.unsplash.com');
    expect(directive(enforced, 'connect-src')).toContain('wss:');
    expect(enforced).toContain('trusted-types');
    expect(enforced).toContain("require-trusted-types-for 'script'");
    expect(enforced).toContain("frame-ancestors 'none'");
  });

  it('does not declare a CSP in vercel.json', () => {
    // The middleware sets it per response. A static copy would either win and
    // break the nonce, or duplicate the policy and drift from it.
    const keys = securityHeaders().map((header) => header.key);

    expect(keys).not.toContain('Content-Security-Policy');
    expect(keys).not.toContain('Content-Security-Policy-Report-Only');
  });

  it('still declares the other security headers statically', () => {
    const keys = securityHeaders().map((header) => header.key);

    // These are constant, so the config is the right place for them.
    expect(keys).toContain('X-Frame-Options');
    expect(keys).toContain('X-Content-Type-Options');
    expect(keys).toContain('Referrer-Policy');
    expect(keys).toContain('Cross-Origin-Opener-Policy');
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
