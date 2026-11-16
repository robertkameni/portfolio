import { randomBytes } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { defineEventHandler, setResponseHeader } from 'h3';
import { buildContentSecurityPolicy, buildReportOnlyPolicy, EVENT_DISPATCH_CONTRACT_HASH } from '../utils/csp-policy';

/**
 * Mints a per-response CSP nonce and publishes the policy.
 *
 * Runs first (`00-`), so the header is on the response before any route handler
 * or SSR render touches it, and so the nonce exists before Angular renders. The
 * nonce is attached to the Node request object, which is what `@analogjs/router`
 * hands Angular as `REQUEST`; `app.config.server.ts` reads it back and provides
 * it as `CSP_NONCE`, so Angular stamps the same value onto its inline scripts.
 *
 * The policy lives in `src/server/utils/csp-policy.ts` so the directives can be
 * asserted without a server.
 *
 * Why the header is set here rather than in `vercel.json`: the value changes per
 * response, and a static config header would either win and break the nonce or
 * duplicate it. Static assets served straight from the CDN therefore carry no
 * CSP. That is acceptable: a policy on a JS or CSS response has no effect, and
 * every HTML document is rendered by this function.
 */
type NonceRequest = IncomingMessage & { cspNonce?: string };

export default defineEventHandler((event) => {
  const nonce = randomBytes(16).toString('base64');
  (event.node.req as NonceRequest).cspNonce = nonce;

  const scriptHashes = [EVENT_DISPATCH_CONTRACT_HASH];
  setResponseHeader(event, 'Content-Security-Policy', buildContentSecurityPolicy({ nonce, scriptHashes, upgradeInsecureRequests: true }));
  setResponseHeader(event, 'Content-Security-Policy-Report-Only', buildReportOnlyPolicy(nonce, scriptHashes));
});
