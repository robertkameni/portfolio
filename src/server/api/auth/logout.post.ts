import { defineEventHandler, setResponseStatus } from 'h3';
import { clearAuthSessionCookies } from '../../utils/auth-cookies';
import { apiAck } from '../../utils/api-response';

export default defineEventHandler((event) => {
  clearAuthSessionCookies(event);

  setResponseStatus(event, 200);
  return apiAck('Logged out successfully.', 'AUTH_LOGOUT_SUCCESS');
});
