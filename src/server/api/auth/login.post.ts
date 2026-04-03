import { defineEventHandler, readBody, createError } from 'h3';
import { userRepository } from '../../db/repositories/user.repository';
import { authService } from '../../auth/auth.service';
import { setAuthSessionCookies } from '../../utils/auth-cookies';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event);

  if (!body?.email || !body?.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Email and password are required.',
    });
  }

  try {
    const user = await userRepository.findByEmail(body.email);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Invalid credentials.',
      });
    }

    const isPasswordValid = await authService.comparePassword(body.password, user.passwordHash);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Invalid credentials.',
      });
    }

    if (user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: User does not have admin privileges.',
      });
    }

    const accessToken = authService.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = authService.generateRefreshToken({ userId: user.id });

    setAuthSessionCookies(event, accessToken, refreshToken, 60 * 15);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown login error';
    console.error('[auth/login] Unexpected error:', message);

    if (message.includes('Missing ACCESS_TOKEN_SECRET') || message.includes('Missing REFRESH_TOKEN_SECRET')) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error: Missing JWT secrets.',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Server Error: Login failed unexpectedly.',
    });
  }
});
