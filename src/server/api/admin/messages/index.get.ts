import { defineEventHandler } from 'h3';
import { prisma } from '../../../db/client';
import { adminGuard } from '../../../utils/authGuard';
import { withApiErrorHandling } from '../../../utils/api-errors';
import { apiSuccess } from '../../../utils/api-response';

/**
 * API endpoint to retrieve all contact form messages.
 * Protected by admin authentication.
 */
export default defineEventHandler(async (event) => {
  adminGuard(event);

  const messages = await withApiErrorHandling(
    () =>
      prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          intelligence: true,
          session: {
            select: {
              id: true,
              visitorId: true,
              startedAt: true,
            },
          },
        },
      }),
    'Internal Server Error: Could not retrieve messages.',
    { logMessage: 'Admin messages retrieval error:' }
  );

  return apiSuccess(messages, 'Messages retrieved.', 'ADMIN_MESSAGES_RETRIEVED');
});
