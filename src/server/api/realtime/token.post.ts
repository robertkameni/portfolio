import { defineEventHandler, readBody, getRequestIP } from 'h3';
import { createHmac, randomUUID } from 'crypto';
import { prisma } from '../../db/client';
import { apiSuccess } from '../../utils/api-response';
import { badRequest, unauthorized, serverError } from '../../utils/api-errors';
import { readPositiveIntFromEnv, rateLimiter } from '../../utils/rate-limiter';

type RealtimeTokenBody = {
  clientSessionId: string;
};

type RealtimeTokenResponse = {
  sessionId: string;
  token: string;
  expiresInMs: number;
};

const REALTIME_TOKEN_TTL_MS = readPositiveIntFromEnv('REALTIME_SESSION_TOKEN_TTL_MS', 120_000);
const REALTIME_TOKEN_NAMESPACE = 'realtime-token';
const REALTIME_TOKEN_SECRET = process.env['REALTIME_SESSION_TOKEN_SECRET'] || process.env['SESSION_SECRET'] || process.env['JWT_SECRET'] || 'change-me-in-production';

function buildSignature(sessionId: string, nonce: string, expiresAt: number): string {
  return createHmac('sha256', REALTIME_TOKEN_SECRET).update(`${sessionId}.${nonce}.${expiresAt}`).digest('hex');
}

export default defineEventHandler(async (event) => {
  if (!process.env['DATABASE_URL']) {
    throw serverError('Realtime service unavailable: database not configured.', 'SERVICE_UNAVAILABLE');
  }

  const body = await readBody<RealtimeTokenBody>(event);
  if (!body?.clientSessionId) {
    throw badRequest('Bad Request: clientSessionId is required.');
  }

  const requestIp = getRequestIP(event) ?? 'unknown';

  let session: Awaited<ReturnType<typeof prisma.visitorSession.findUnique>>;
  try {
    session = await prisma.visitorSession.findUnique({ where: { clientSessionId: body.clientSessionId } });
  } catch (err) {
    console.error('[RealtimeToken] DB query failed:', err);
    throw serverError('Realtime service temporarily unavailable.', 'DB_ERROR');
  }

  if (!session) {
    throw unauthorized('Unauthorized: Invalid session.');
  }

  if (session.ipAddress && session.ipAddress !== requestIp) {
    throw unauthorized('Unauthorized: Session fingerprint mismatch.');
  }

  const nonce = randomUUID();
  const expiresAt = Date.now() + REALTIME_TOKEN_TTL_MS;
  const signature = buildSignature(body.clientSessionId, nonce, expiresAt);
  const token = `${nonce}.${expiresAt}.${signature}`;
  const tokenKey = `session:${session.id}:${nonce}`;
  const tokenStored = await rateLimiter.setIfAbsent(REALTIME_TOKEN_NAMESPACE, tokenKey, signature, REALTIME_TOKEN_TTL_MS);
  if (!tokenStored) {
    throw unauthorized('Unauthorized: Could not allocate realtime token.');
  }

  const responsePayload: RealtimeTokenResponse = {
    sessionId: body.clientSessionId,
    token,
    expiresInMs: REALTIME_TOKEN_TTL_MS,
  };

  return apiSuccess(responsePayload, 'Realtime token issued.', 'REALTIME_TOKEN_ISSUED');
});
