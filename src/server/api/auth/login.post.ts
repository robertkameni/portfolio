import { defineEventHandler, readBody } from 'h3';
import { userRepository } from '../../db/repositories/user.repository';
import { authService } from '../../auth/auth.service';
import { setAuthSessionCookies } from '../../utils/auth-cookies';
import { badRequest, forbidden, serverError, unauthorized } from '../../utils/api-errors';
import { apiSuccess } from '../../utils/api-response';
import { hasRequiredStringFields } from '../../utils/request-validation';

type LoginBody = {
  email?: string;
  password?: string;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event);

  if (!hasRequiredStringFields(body, ['email', 'password'])) {
    throw badRequest('Bad Request: Email and password are required.');
  }

  try {
    const user = await userRepository.findByEmail(body.email);
    if (!user) {
      throw unauthorized('Unauthorized: Invalid credentials.');
    }

    const isPasswordValid = await authService.comparePassword(body.password, user.passwordHash);
    if (!isPasswordValid) {
      throw unauthorized('Unauthorized: Invalid credentials.');
    }

    if (user.role !== 'ADMIN') {
      throw forbidden('Forbidden: User does not have admin privileges.');
    }

    const accessToken = authService.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = authService.generateRefreshToken({ userId: user.id });

    setAuthSessionCookies(event, accessToken, refreshToken, 60 * 15);

    return apiSuccess(
      {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      },
      'Login successful.',
      'AUTH_LOGIN_SUCCESS'
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown login error';
    console.error('[auth/login] Unexpected error:', message);

    if (message.includes('Missing ACCESS_TOKEN_SECRET') || message.includes('Missing REFRESH_TOKEN_SECRET')) {
      throw serverError('Server configuration error: Missing JWT secrets.');
    }

    throw serverError('Server Error: Login failed unexpectedly.');
  }
});
