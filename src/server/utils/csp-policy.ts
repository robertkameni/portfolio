/**
 * The Content-Security-Policy, in one place.
 *
 * Built rather than pinned because the two inline scripts Angular emits are not
 * stable across routes: the event-replay bootstrap lists the events a page uses,
 * so `/` ships `["click","submit"]` and `/cv` ships `["click"]`, which is two
 * different hashes for the same script. Hash-pinning that meant every new route
 * with a different event set was silently blocked, and the old guard could not
 * see it because it read `vercel.json`, not the served HTML.
 *
 * A nonce removes the whole class: the value changes per response, Angular
 * stamps it onto its own inline scripts through `CSP_NONCE`, and no payload
 * shipped by the framework has to be allowlisted by hand again.
 *
 * `'unsafe-inline'` must never appear in `script-src` beside a nonce: browsers
 * ignore the nonce as soon as it does, and the policy silently falls back to
 * allowing every inline script.
 */
export type CspOptions = {
  /** Per-response nonce, base64. Must also be given to Angular's CSP_NONCE. */
  nonce: string;
  /**
   * Hashes for inline scripts that Angular does not stamp with the nonce.
   *
   * Angular's `ng-event-dispatch-contract` is injected into the app shell at
   * build time by the Analog Vite plugin, before SSR runs, so `CSP_NONCE` never
   * reaches it. Its content is a fixed file in the Angular package, unlike the
   * per-route bootstrap payload, so a hash is stable here. `src/csp.spec.ts`
   * recomputes it from `node_modules` on every run, so an Angular upgrade that
   * changes the file fails the build instead of silently blocking the script.
   */
  scriptHashes?: readonly string[];
  /** Adds `report-uri`, for the report-only variant. */
  reportUri?: string;
};

/**
 * SHA-256 of Angular's event-dispatch contract, which the Analog Vite plugin
 * inlines into the app shell at build time, before SSR runs, so `CSP_NONCE`
 * never reaches it. Unlike the per-route bootstrap payload, this content is a
 * fixed file in the Angular package, so a hash is stable here.
 *
 * Declared as a constant rather than read from `node_modules` at runtime: the
 * deployed function is bundled and does not carry that path. `src/csp.spec.ts`
 * recomputes the hash from the file on every test run, so an Angular upgrade
 * that changes the payload fails the build instead of silently blocking the
 * script in production.
 */
export const EVENT_DISPATCH_CONTRACT_HASH = 'sha256-VM2mZqyEQZoLzoTrp5EigFvzQ0+f1wSeBuoOn95WHCg=';

/** Where the file lives, so the spec can verify the constant above. */
export const EVENT_DISPATCH_CONTRACT_PATH = 'node_modules/@angular/core/event-dispatch-contract.min.js';

/** Hosts the app may load images from. `'self'` covers the app's own assets. */
const IMAGE_HOSTS = ["'self'", 'https://images.unsplash.com', 'https://lucastar.de', 'data:', 'blob:'];

/** `connect-src` allows the websocket the realtime twin opens. */
const CONNECT_HOSTS = ["'self'", 'wss:'];

export function buildContentSecurityPolicy(options: CspOptions): string {
  const { nonce, scriptHashes = [], reportUri } = options;

  const scriptSrc = ["'self'", `'nonce-${nonce}'`, ...scriptHashes.map((hash) => `'${hash}'`)].join(' ');

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
    'trusted-types angular angular#bundler angular#unsafe-bypass dompurify',
    "require-trusted-types-for 'script'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${IMAGE_HOSTS.join(' ')}`,
    "font-src 'self'",
    `connect-src ${CONNECT_HOSTS.join(' ')}`,
  ];

  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join('; ');
}

/** The report-only policy: identical, plus the endpoint. */
export function buildReportOnlyPolicy(nonce: string, scriptHashes: readonly string[] = []): string {
  return buildContentSecurityPolicy({ nonce, scriptHashes, reportUri: '/api/csp-report' });
}
