/**
 * HMAC signing for realtime query tokens (SSE). Best-effort security for a single-instance demo.
 * Prefer setting REALTIME_SESSION_TOKEN_SECRET on deployed hosts.
 */
export function resolveRealtimeSigningSecret(): string {
  return (
    process.env['REALTIME_SESSION_TOKEN_SECRET']?.trim() || process.env['SESSION_SECRET']?.trim() || process.env['JWT_SECRET']?.trim() || 'portfolio-local-realtime-demo-secret'
  );
}
