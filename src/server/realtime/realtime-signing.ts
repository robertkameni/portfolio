import { randomBytes } from 'node:crypto';

/**
 * Resolve the secret used to sign realtime query tokens (SSE).
 *
 * Priorities:
 * 1. REALTIME_SESSION_TOKEN_SECRET — the dedicated realtime secret.
 * 2. SESSION_SECRET — a validated fallback when the dedicated secret is absent
 *    (not recommended long-term; prefer the dedicated var).
 *
 * Production: MUST have at least one of the two secrets set. Throws on boot
 * if neither is available — no hardcoded defaults ship to production.
 *
 * Development: when both secrets are missing a random ephemeral secret is
 * generated per process with a console.warn. It never leaks into production.
 */
export function resolveRealtimeSigningSecret(): string {
  const dedicated = process.env['REALTIME_SESSION_TOKEN_SECRET']?.trim();
  if (dedicated) {
    return dedicated;
  }

  const sessionFallback = process.env['SESSION_SECRET']?.trim();
  if (sessionFallback) {
    return sessionFallback;
  }

  const isProduction = process.env['NODE_ENV'] === 'production' || process.env['VERCEL_ENV'] === 'production';

  if (isProduction) {
    throw new Error('Realtime signing secret is missing in production. Set REALTIME_SESSION_TOKEN_SECRET or SESSION_SECRET.');
  }

  const ephemeral = randomBytes(32).toString('hex');
  console.warn('[realtime] No REALTIME_SESSION_TOKEN_SECRET or SESSION_SECRET set — using an ephemeral dev-only key. Tokens are NOT valid across restarts.');
  return ephemeral;
}
