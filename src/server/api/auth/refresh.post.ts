import { defineEventHandler, getCookie } from 'h3';
import { userRepository } from '../../db/repositories/user.repository';
import { authService } from '../../auth/auth.service';
import { ACCESS_TOKEN_MAX_AGE_SECONDS } from '../../auth/access-token-expiry';
import { clearAuthSessionCookies, setAuthSessionCookies } from '../../utils/auth-cookies';
import { forbidden, unauthorized } from '../../utils/api-errors';
import { apiSuccess } from '../../utils/api-response';

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refreshToken');
  if (!refreshToken) {
    clearAuthSessionCookies(event);
    throw unauthorized('Unauthorized: Missing refresh token.');
  }

  const payload = authService.verifyRefreshToken<{ userId: string; }>(refreshToken);
  if (!payload) {
    clearAuthSessionCookies(event);
    throw unauthorized('Unauthorized: Invalid refresh token.');
  }

  const user = await userRepository.findById(payload.userId);
  if (!user) {
    clearAuthSessionCookies(event);
    throw unauthorized('Unauthorized: User no longer exists.');
  }

  // Only allow refresh for admin users
  if (user.role !== 'ADMIN') {
    clearAuthSessionCookies(event);
    throw forbidden('Forbidden: Admin access required');
  }

  const newAccessToken = authService.generateAccessToken({ userId: user.id, role: user.role });
  const newRefreshToken = authService.generateRefreshToken({ userId: user.id });

  setAuthSessionCookies(event, newAccessToken, newRefreshToken, ACCESS_TOKEN_MAX_AGE_SECONDS);

  return apiSuccess(
    {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    },
    'Session refreshed.',
    'AUTH_REFRESH_SUCCESS',
  );
});
