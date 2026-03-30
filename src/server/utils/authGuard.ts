import { createError, getCookie, getHeader, H3Event } from 'h3';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env['ACCESS_TOKEN_SECRET'];

interface JwtPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export const authGuard = (event: H3Event): JwtPayload => {
  const cookieToken = getCookie(event, 'auth_token');
  const authorizationHeader = getHeader(event, 'authorization');
  const bearerToken = authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7) : null;
  const token = cookieToken ?? bearerToken;

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Missing token',
    });
  }

  if (!ACCESS_TOKEN_SECRET) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error: Missing ACCESS_TOKEN_SECRET',
    });
  }

  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as unknown as JwtPayload;
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid token',
    });
  }
};

export const adminGuard = (event: H3Event): JwtPayload => {
  const payload = authGuard(event);
  if (payload.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Admin access required',
    });
  }
  return payload;
};
