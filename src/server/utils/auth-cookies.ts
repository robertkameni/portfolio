import { deleteCookie, setCookie, type H3Event } from 'h3';

const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const AUTH_HINT_MAX_AGE = REFRESH_COOKIE_MAX_AGE;
const AUTH_COOKIE_PATH = '/';

function isSecureCookie(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

export function setAuthSessionCookies(event: H3Event, accessToken: string, refreshToken: string, accessTokenMaxAge: number): void {
  const secure = isSecureCookie();

  setCookie(event, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: AUTH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });

  setCookie(event, 'auth_token', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: AUTH_COOKIE_PATH,
    maxAge: accessTokenMaxAge,
  });

  setCookie(event, 'auth_hint', '1', {
    httpOnly: false,
    secure,
    sameSite: 'strict',
    path: AUTH_COOKIE_PATH,
    maxAge: AUTH_HINT_MAX_AGE,
  });
}

export function clearAuthSessionCookies(event: H3Event): void {
  const secure = isSecureCookie();

  deleteCookie(event, 'auth_token', {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: AUTH_COOKIE_PATH,
  });

  deleteCookie(event, 'refreshToken', {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: AUTH_COOKIE_PATH,
  });

  deleteCookie(event, 'auth_hint', {
    httpOnly: false,
    secure,
    sameSite: 'strict',
    path: AUTH_COOKIE_PATH,
  });
}

