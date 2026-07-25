import { defineEventHandler, readBody } from 'h3';
import { prisma } from '../db/client';
import { badRequest, withApiErrorHandling } from '../utils/api-errors';
import { apiAck } from '../utils/api-response';
import { hasRequiredStringFields } from '../utils/request-validation';
import { assertMaxUtf8ByteLength, enforceIngestRateLimit } from '../utils/ingestion-guards';
import { readPositiveIntFromEnv } from '../utils/env.util';

const INGEST_CONTACT_NAMESPACE = 'ingest:contact';

type ContactRequestBody = {
  name?: string;
  email: string;
  message: string;
  sessionId?: string;
};

/**
 * Public API endpoint for contact form submissions.
 * Stores messages in the database for admin review.
 * No authentication required — this is a public form.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<ContactRequestBody>(event);

  if (!hasRequiredStringFields(body, ['email', 'message'])) {
    throw badRequest('Bad Request: Email and message are required.');
  }

  await enforceIngestRateLimit(event, INGEST_CONTACT_NAMESPACE, 'INGEST_CONTACT_IP_MAX', 'INGEST_CONTACT_WINDOW_MS', 15, 3_600_000);

  const emailMaxBytes = readPositiveIntFromEnv('INGEST_CONTACT_EMAIL_MAX_BYTES', 320, 32);
  assertMaxUtf8ByteLength('email', body.email, emailMaxBytes);

  const nameMaxBytes = readPositiveIntFromEnv('INGEST_CONTACT_NAME_MAX_BYTES', 256, 32);
  if (body.name != null && body.name.length > 0) {
    assertMaxUtf8ByteLength('name', body.name, nameMaxBytes);
  }

  const messageMaxBytes = readPositiveIntFromEnv('INGEST_CONTACT_MESSAGE_MAX_BYTES', 16_384, 256);
  assertMaxUtf8ByteLength('message', body.message, messageMaxBytes);

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    throw badRequest('Bad Request: Invalid email format.');
  }

  let sessionClientId: string | undefined = typeof body.sessionId === 'string' && body.sessionId.trim().length > 0 ? body.sessionId.trim() : undefined;
  if (sessionClientId) {
    const sessionExists = await prisma.visitorSession.findUnique({
      where: { clientSessionId: sessionClientId },
      select: { id: true },
    });
    if (!sessionExists) {
      sessionClientId = undefined;
    }
  }

  await withApiErrorHandling(
    async () => {
      await prisma.message.create({
        data: {
          senderName: body.name || null,
          senderEmail: body.email,
          body: body.message,
          status: 'UNREAD',
          // Link to visitor session if available
          ...(sessionClientId
            ? {
                session: {
                  connect: { clientSessionId: sessionClientId },
                },
              }
            : {}),
        },
      });
    },
    'Internal Server Error: Could not save your message.',
    { logMessage: 'Contact form submission error:' },
  );

  event.node.res.statusCode = 201;
  return apiAck('Message received. I will get back to you soon!', 'CONTACT_MESSAGE_CREATED');
});
