import { defineEventHandler, getRequestIP } from 'h3';
import { broadcastService } from '../realtime/broadcast.service';
import { getSingleQueryString } from '../utils/query-params';
import { prisma } from '../db/client';
import { resolveRealtimeSigningSecret } from '../realtime/realtime-signing';
import { badRequest, serverError } from '../utils/api-errors';
import { unauthorized } from '../utils/api-errors';
import { createHmac, timingSafeEqual } from 'crypto';

export default defineEventHandler(async (event) => {
  const tokenSecret = resolveRealtimeSigningSecret();

  const sessionId = getSingleQueryString(event, 'sessionId');
  const token = getSingleQueryString(event, 'token');

  if (!sessionId) {
    throw badRequest('Session ID is required.');
  }
  if (!token) {
    throw badRequest('Bad Request: token is required.');
  }

  let session: Awaited<ReturnType<typeof prisma.visitorSession.findUnique>>;
  try {
    session = await prisma.visitorSession.findUnique({
      where: { clientSessionId: sessionId },
    });
  } catch (error) {
    console.error('[realtime] session lookup failed:', error);
    throw serverError('Realtime service temporarily unavailable.', 'DB_ERROR');
  }

  if (!session) {
    throw unauthorized('Unauthorized: Invalid session.');
  }

  const requestIp = getRequestIP(event) ?? 'unknown';
  if (session.ipAddress && session.ipAddress !== requestIp) {
    throw unauthorized('Unauthorized: Session fingerprint mismatch.');
  }

  const [nonce, expiresAtString, signature] = token.split('.');
  if (!nonce || !expiresAtString || !signature) {
    throw badRequest('Bad Request: invalid token format.');
  }

  const expiresAt = Number.parseInt(expiresAtString, 10);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    throw unauthorized('Unauthorized: Realtime token expired.');
  }

  const expectedSignature = createHmac('sha256', tokenSecret).update(`${session.clientSessionId}.${nonce}.${expiresAt}`).digest('hex');

  if (!constantTimeEquals(signature, expectedSignature)) {
    throw unauthorized('Unauthorized: Invalid token signature.');
  }

  await prisma.visitorSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  event.node.res.setHeader('Content-Type', 'text/event-stream');
  event.node.res.setHeader('Cache-Control', 'no-cache');
  event.node.res.setHeader('Connection', 'keep-alive');

  const sendEvent = (eventName: string, data: any) => {
    event.node.res.write(`event: ${eventName}\n`);
    event.node.res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const channel = `realtime:${sessionId}`;

  try {
    await broadcastService.subscribe(channel, (data) => {
      sendEvent(data.eventName, data.payload);
    });

    sendEvent('connected', { message: 'Connection established' });

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) {
        return;
      }
      cleanedUp = true;
      void broadcastService.unsubscribe(channel).catch((error) => {
        console.error(`[realtime] unsubscribe failed for channel ${channel}:`, error);
      });
    };

    event.node.req.on('close', cleanup);
  } catch (error) {
    console.error('[realtime] subscription error:', error);
    throw serverError('Realtime service unavailable');
  }

  return new Promise(() => {});
});

export async function pushUpdateToClient(targetSessionId: string, eventName: string, payload: any): Promise<void> {
  try {
    await broadcastService.publish({ targetSessionId, eventName, payload });
  } catch (error) {
    console.error(`[realtime] push failed for session ${targetSessionId}:`, error);
  }
}

function constantTimeEquals(left: string, right: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
  } catch {
    return false;
  }
}
