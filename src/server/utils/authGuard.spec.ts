// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import type { H3Event } from 'h3';

vi.mock('h3', () => ({
  getCookie: vi.fn(),
  getHeader: vi.fn(),
}));

vi.mock('./api-errors', () => ({
  unauthorized: (message: string) => Object.assign(new Error(message), { statusCode: 401 }),
  forbidden: (message: string) => Object.assign(new Error(message), { statusCode: 403 }),
  serverError: (message: string) => Object.assign(new Error(message), { statusCode: 500 }),
}));

import { getCookie, getHeader } from 'h3';
import { adminGuard, authGuard } from './authGuard';

describe('authGuard', () => {
  const secret = 'test-access-secret';

  beforeEach(() => {
    process.env['ACCESS_TOKEN_SECRET'] = secret;
    vi.mocked(getCookie).mockReset();
    vi.mocked(getHeader).mockReset();
  });

  it('rejects missing tokens and missing secrets', () => {
    vi.mocked(getCookie).mockReturnValue(undefined);
    vi.mocked(getHeader).mockReturnValue(undefined);
    expect(() => authGuard({} as H3Event)).toThrow(/Missing token/);

    delete process.env['ACCESS_TOKEN_SECRET'];
    vi.mocked(getCookie).mockReturnValue('token');
    expect(() => authGuard({} as H3Event)).toThrow(/Missing ACCESS_TOKEN_SECRET/);
  });

  it('verifies HS256 cookie and bearer tokens', () => {
    const token = jwt.sign({ userId: 'u1', role: 'ADMIN' }, secret, { algorithm: 'HS256', expiresIn: '1h' });
    vi.mocked(getCookie).mockReturnValue(token);
    vi.mocked(getHeader).mockReturnValue(undefined);

    expect(authGuard({} as H3Event)).toMatchObject({ userId: 'u1', role: 'ADMIN' });

    vi.mocked(getCookie).mockReturnValue(undefined);
    vi.mocked(getHeader).mockReturnValue(`Bearer ${token}`);
    expect(authGuard({} as H3Event).userId).toBe('u1');
  });

  it('rejects invalid tokens and non-admin roles', () => {
    vi.mocked(getCookie).mockReturnValue('not-a-jwt');
    expect(() => authGuard({} as H3Event)).toThrow(/Invalid token/);

    const userToken = jwt.sign({ userId: 'u2', role: 'USER' }, secret, { algorithm: 'HS256', expiresIn: '1h' });
    vi.mocked(getCookie).mockReturnValue(userToken);
    expect(() => adminGuard({} as H3Event)).toThrow(/Admin access/);
  });
});
