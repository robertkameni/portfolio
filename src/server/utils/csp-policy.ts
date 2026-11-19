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
 *
 * One directive is deliberately absent from the report-only policy.
 * `upgrade-insecure-requests` is not a restriction: it tells the browser to
 * rewrite `http://` subresource URLs to `https://`. A report-only policy has no
 * effect on the page, so a browser drops the directive and logs a warning
 * ("'upgrade-insecure-requests' is ignored when delivered in a report-only
 * policy"). Emitting it there produced a console warning on every response
 * while changing nothing. It belongs to the enforced policy only.
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
  /**
   * Emit `upgrade-insecure-requests`. Only meaningful on the enforced policy:
   * the directive rewrites requests rather than restricting them, so a
   * report-only delivery is ignored by the browser and logs a warning.
   */
  upgradeInsecureRequests?: boolean;
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
  const { nonce, scriptHashes = [], reportUri, upgradeInsecureRequests = false } = options;

  const scriptSrc = ["'self'", `'nonce-${nonce}'`, ...scriptHashes.map((hash) => `'${hash}'`)].join(' ');

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    'trusted-types angular angular#bundler angular#unsafe-bypass dompurify json-ld',
    "require-trusted-types-for 'script'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${IMAGE_HOSTS.join(' ')}`,
    "font-src 'self'",
    `connect-src ${CONNECT_HOSTS.join(' ')}`,
  ];

  // Kept out of the shared list above because the report-only policy must not
  // carry it: see the note on CspOptions.
  if (upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }

  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join('; ');
}

/**
 * The report-only policy: the enforced one plus the endpoint, minus
 * `upgrade-insecure-requests`.
 *
 * That directive is the one deliberate difference beyond `report-uri`. A
 * browser ignores it in a report-only policy and logs a warning on every
 * response, so predicting the enforced policy does not require it.
 */
export function buildReportOnlyPolicy(nonce: string, scriptHashes: readonly string[] = []): string {
  return buildContentSecurityPolicy({ nonce, scriptHashes, reportUri: '/api/csp-report' });
}
