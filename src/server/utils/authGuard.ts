import { getCookie, getHeader, H3Event } from 'h3';
import jwt from 'jsonwebtoken';
import { forbidden, serverError, unauthorized } from './api-errors';

interface JwtPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

function getAccessTokenSecret(): string {
  const secret = process.env['ACCESS_TOKEN_SECRET'];
  if (!secret) {
    throw serverError('Server configuration error: Missing ACCESS_TOKEN_SECRET');
  }
  return secret;
}

export const authGuard = (event: H3Event): JwtPayload => {
  const cookieToken = getCookie(event, 'auth_token');
  const authorizationHeader = getHeader(event, 'authorization');
  const bearerToken = authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7) : null;
  const token = cookieToken ?? bearerToken;

  if (!token) {
    throw unauthorized('Unauthorized: Missing token');
  }

  const accessTokenSecret = getAccessTokenSecret();

  try {
    return jwt.verify(token, accessTokenSecret, { algorithms: ['HS256'] }) as unknown as JwtPayload;
  } catch {
    throw unauthorized('Unauthorized: Invalid token');
  }
};

export const adminGuard = (event: H3Event): JwtPayload => {
  const payload = authGuard(event);
  if (payload.role !== 'ADMIN') {
    throw forbidden('Forbidden: Admin access required');
  }
  return payload;
};
