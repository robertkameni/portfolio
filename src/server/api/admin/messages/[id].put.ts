import { defineEventHandler, readBody, getRouterParam } from 'h3';
import { prisma } from '../../../db/client';
import { adminGuard } from '../../../utils/authGuard';
import { badRequest, notFound, withApiErrorHandling } from '../../../utils/api-errors';
import { apiSuccess } from '../../../utils/api-response';

type UpdateMessageBody = {
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
};

/**
 * API endpoint to update a message's status (e.g., mark as read).
 * Protected by admin authentication.
 */
export default defineEventHandler(async (event) => {
  adminGuard(event);

  const id = getRouterParam(event, 'id');
  const body = await readBody<UpdateMessageBody>(event);

  if (!id) {
    throw badRequest('Bad Request: Message ID is required.');
  }

  if (!body.status || !['UNREAD', 'READ', 'ARCHIVED'].includes(body.status)) {
    throw badRequest('Bad Request: Status must be one of: UNREAD, READ, ARCHIVED.');
  }

  const message = await withApiErrorHandling(
    async () => {
      const existing = await prisma.message.findUnique({ where: { id } });
      if (!existing) {
        throw notFound('Message not found.');
      }

      return prisma.message.update({
        where: { id },
        data: { status: body.status },
        include: { intelligence: true },
      });
    },
    'Internal Server Error: Could not update message.',
    { logMessage: 'Admin message update error:' },
  );

  return apiSuccess(message, 'Message updated.', 'ADMIN_MESSAGE_UPDATED');
});
