import { defineEventHandler, setResponseStatus } from 'h3';
import { userRepository } from '../../db/repositories/user.repository';
import { adminGuard } from '../../utils/authGuard';

export default defineEventHandler(async (event) => {
  // This will throw an error if the user is not authenticated or not an admin
  const { userId } = adminGuard(event);

  const user = await userRepository.findById(userId);

  if (!user) {
    setResponseStatus(event, 404);
    return { statusMessage: 'User not found' };
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
});
