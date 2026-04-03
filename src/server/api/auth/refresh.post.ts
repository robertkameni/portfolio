import { createError, defineEventHandler, getCookie } from 'h3';
import { userRepository } from '../../db/repositories/user.repository';
import { authService } from '../../auth/auth.service';
import { clearAuthSessionCookies, setAuthSessionCookies } from '../../utils/auth-cookies';

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refreshToken');
  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Missing refresh token.',
    });
  }

  const payload = authService.verifyRefreshToken<{ userId: string }>(refreshToken);
  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid refresh token.',
    });
  }

  const user = await userRepository.findById(payload.userId);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: User no longer exists.',
    });
  }

  // Only allow refresh for admin users
  if (user.role !== 'ADMIN') {
    clearAuthSessionCookies(event);
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin access required' });
  }

  const newAccessToken = authService.generateAccessToken({ userId: user.id, role: user.role });
  const newRefreshToken = authService.generateRefreshToken({ userId: user.id });

  setAuthSessionCookies(event, newAccessToken, newRefreshToken, 60 * 20);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    accessToken: newAccessToken,
  };
});
