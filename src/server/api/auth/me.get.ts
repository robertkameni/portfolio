import { defineEventHandler } from 'h3';
import { userRepository } from '../../db/repositories/user.repository';
import { adminGuard } from '../../utils/authGuard';
import { apiSuccess } from '../../utils/api-response';
import { notFound } from '../../utils/api-errors';

export default defineEventHandler(async (event) => {
  // This will throw an error if the user is not authenticated or not an admin
  const { userId } = adminGuard(event);

  const user = await userRepository.findById(userId);

  if (!user) {
    throw notFound('User not found', 'AUTH_ME_NOT_FOUND');
  }

  return apiSuccess(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    'Authenticated user fetched.',
    'AUTH_ME_SUCCESS'
  );
});
