import { serverError } from '../utils/api-errors';

/**
 * Required for distributed realtime (token handshake and SSE broadcast).
 */
export function requireRealtimeRedisUrl(): string {
  const raw = process.env['UPSTASH_REDIS_URL'] ?? process.env['REDIS_URL'];
  const url = raw?.trim();
  if (!url) {
    throw serverError(
      'Realtime service unavailable: configure UPSTASH_REDIS_URL or REDIS_URL.',
      'REALTIME_MISCONFIGURED',
    );
  }
  return url;
}

/**
 * HMAC signing key for realtime session tokens only. Fail closed — no JWT/session fallbacks.
 */
export function requireRealtimeTokenSecret(): string {
  const secret = process.env['REALTIME_SESSION_TOKEN_SECRET']?.trim();
  if (!secret) {
    throw serverError(
      'Realtime service unavailable: set REALTIME_SESSION_TOKEN_SECRET.',
      'REALTIME_MISCONFIGURED',
    );
  }
  return secret;
}
