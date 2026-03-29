import { defineEventHandler, readBody, setCookie, createError } from 'h3';
import { userRepository } from '../../db/repositories/user.repository';
import { authService } from '../../auth/auth.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Email and password are required.',
    });
  }

  // 1. Find the user by email
  const user = await userRepository.findByEmail(body.email);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid credentials.',
    });
  }

  // 2. Compare the provided password with the stored hash
  const isPasswordValid = await authService.comparePassword(body.password, user.passwordHash);
  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid credentials.',
    });
  }

  // 3. Generate tokens
  // Only allow admin users to sign in to the portfolio admin
  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: User does not have admin privileges.',
    });
  }

  const accessToken = authService.generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = authService.generateRefreshToken({ userId: user.id });

  // 4. Set the refresh token in a secure, HTTP-only cookie
  setCookie(event, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  setCookie(event, 'auth_token', accessToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 15,
  });

  setCookie(event, 'auth_hint', '1', {
    httpOnly: false,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  // 5. Return the access token in the response body
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    accessToken,
  };
});
