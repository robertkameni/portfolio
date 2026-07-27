import { defineEventHandler, getRequestIP, readBody } from 'h3';
import { userRepository } from '../../db/repositories/user.repository';
import { authService } from '../../auth/auth.service';
import { ACCESS_TOKEN_MAX_AGE_SECONDS } from '../../auth/access-token-expiry';
import { setAuthSessionCookies } from '../../utils/auth-cookies';
import { badRequest, forbidden, serverError, tooManyRequests, unauthorized } from '../../utils/api-errors';
import { apiSuccess } from '../../utils/api-response';
import { hasRequiredStringFields } from '../../utils/request-validation';
import { rateLimiter } from '../../utils/rate-limiter';

type LoginBody = {
  email?: string;
  password?: string;
};

export default defineEventHandler(async (event) => {
  const clientIp = getRequestIP(event) ?? 'unknown';

  const rateLimit = await rateLimiter.checkRateLimit('auth', `login:${clientIp}`, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    throw tooManyRequests('Too many login attempts. Please try again later.', 'AUTH_RATE_LIMITED');
  }

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

    setAuthSessionCookies(event, accessToken, refreshToken, ACCESS_TOKEN_MAX_AGE_SECONDS);

    return apiSuccess(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      'Login successful.',
      'AUTH_LOGIN_SUCCESS',
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
