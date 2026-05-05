import type { H3Event } from 'h3';
import { getRequestIP } from 'h3';
import { rateLimiter, readPositiveIntFromEnv } from './rate-limiter';
import { badRequest, tooManyRequests } from './api-errors';

export function ingestionClientIpKey(event: H3Event): string {
  return getRequestIP(event) ?? 'unknown';
}

export async function enforceIngestRateLimit(
  event: H3Event,
  namespace: string,
  maxEnvVar: string,
  windowMsEnvVar: string,
  defaultMax: number,
  defaultWindowMs: number,
): Promise<void> {
  const maxRequests = readPositiveIntFromEnv(maxEnvVar, defaultMax);
  const windowMs = readPositiveIntFromEnv(windowMsEnvVar, defaultWindowMs, 1000);
  const decision = await rateLimiter.checkRateLimit(namespace, `ip:${ingestionClientIpKey(event)}`, {
    maxRequests,
    windowMs,
  });
  if (!decision.allowed) {
    throw tooManyRequests('Too many requests. Please try again later.', 'INGEST_RATE_LIMITED');
  }
}

export function assertMaxUtf8ByteLength(label: string, value: string, maxBytes: number): void {
  if (Buffer.byteLength(value, 'utf8') > maxBytes) {
    throw badRequest(`Bad Request: ${label} is too large.`, 'PAYLOAD_TOO_LARGE');
  }
}

export function assertJsonPayloadMaxBytes(payload: Record<string, unknown>, maxBytes: number, label = 'payload'): void {
  let encoded: string;
  try {
    encoded = JSON.stringify(payload);
  } catch {
    throw badRequest(`Bad Request: ${label} must be serializable JSON.`, 'BAD_REQUEST');
  }
  assertMaxUtf8ByteLength(label, encoded, maxBytes);
}
