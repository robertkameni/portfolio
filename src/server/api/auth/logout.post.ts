import { defineEventHandler, deleteCookie, setResponseStatus } from 'h3';

export default defineEventHandler((event) => {
  deleteCookie(event, 'auth_token', {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/',
  });

  deleteCookie(event, 'refreshToken', {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/',
  });

  deleteCookie(event, 'auth_hint', {
    httpOnly: false,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/',
  });

  setResponseStatus(event, 200);
  return { statusMessage: 'Logged out successfully' };
});

