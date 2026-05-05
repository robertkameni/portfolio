import { defineEventHandler, readBody, getRequestIP } from 'h3';
import { createHmac, randomUUID } from 'crypto';
import { prisma } from '../../db/client';
import { apiSuccess } from '../../utils/api-response';
import { badRequest, unauthorized, serverError } from '../../utils/api-errors';
import { resolveRealtimeSigningSecret } from '../../realtime/realtime-signing';
import { readPositiveIntFromEnv } from '../../utils/rate-limiter';

type RealtimeTokenBody = {
  clientSessionId: string;
};

type RealtimeTokenResponse = {
  sessionId: string;
  token: string;
  expiresInMs: number;
};

const REALTIME_TOKEN_TTL_MS = readPositiveIntFromEnv('REALTIME_SESSION_TOKEN_TTL_MS', 120_000);

function buildSignature(secret: string, sessionId: string, nonce: string, expiresAt: number): string {
  return createHmac('sha256', secret).update(`${sessionId}.${nonce}.${expiresAt}`).digest('hex');
}

export default defineEventHandler(async (event) => {
  if (!process.env['DATABASE_URL']) {
    throw serverError('Realtime service unavailable: database not configured.', 'SERVICE_UNAVAILABLE');
  }

  const tokenSecret = resolveRealtimeSigningSecret();

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
  const signature = buildSignature(tokenSecret, body.clientSessionId, nonce, expiresAt);
  const token = `${nonce}.${expiresAt}.${signature}`;

  return apiSuccess<RealtimeTokenResponse>(
    {
      sessionId: body.clientSessionId,
      token,
      expiresInMs: REALTIME_TOKEN_TTL_MS,
    },
    'Realtime token issued.',
    'REALTIME_TOKEN_ISSUED',
  );
});
