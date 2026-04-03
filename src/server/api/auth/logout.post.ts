import { defineEventHandler, setResponseStatus } from 'h3';
import { clearAuthSessionCookies } from '../../utils/auth-cookies';

export default defineEventHandler((event) => {
  clearAuthSessionCookies(event);

  setResponseStatus(event, 200);
  return { statusMessage: 'Logged out successfully' };
});
