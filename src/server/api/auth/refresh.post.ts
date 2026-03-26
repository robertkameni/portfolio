import {createError, defineEventHandler, getCookie, setCookie} from 'h3';
import {userRepository} from '../../db/repositories/user.repository';
import {authService} from '../../auth/auth.service';

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refreshToken');
  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Missing refresh token.'
    });
  }

  const payload = authService.verifyRefreshToken<{ userId: string }>(refreshToken);
  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid refresh token.'
    });
  }

  const user = await userRepository.findById(payload.userId);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: User no longer exists.'
    });
  }

  const newAccessToken = authService.generateAccessToken({userId: user.id, role: user.role});
  const newRefreshToken = authService.generateRefreshToken({userId: user.id});

  const cookieOptions = {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 20 // 20 minutes
  };

  setCookie(event, 'auth_token', newAccessToken, cookieOptions);
  setCookie(event, 'refreshToken', newRefreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7 // 7 days for the refresh token
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    accessToken: newAccessToken
  };
});

