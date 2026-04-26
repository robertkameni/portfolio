import { defineEventHandler, readBody } from 'h3';
import { prisma } from '../db/client';
import { badRequest, withApiErrorHandling } from '../utils/api-errors';
import { apiAck } from '../utils/api-response';
import { hasRequiredStringFields } from '../utils/request-validation';

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

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    throw badRequest('Bad Request: Invalid email format.');
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
          ...(body.sessionId
            ? {
                session: {
                  connect: { clientSessionId: body.sessionId },
                },
              }
            : {}),
        },
      });
    },
    'Internal Server Error: Could not save your message.',
    { logMessage: 'Contact form submission error:' }
  );

  event.node.res.statusCode = 201;
  return apiAck('Message received. I will get back to you soon!', 'CONTACT_MESSAGE_CREATED');
});
