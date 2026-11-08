import { createError, defineEventHandler, sendError } from 'h3';
import { authGuard } from '../utils/authGuard';
import { userRepository } from '../db/repositories/user.repository';

/**
 * This middleware protects routes by verifying the JWT access token.
 * If the token is valid, it fetches the user and attaches it to the event context.
 * If invalid, it rejects the request.
 *
 * In AnalogJS, middleware in the /server/middleware directory applies to all server routes.
 * We can add logic to make it apply only to specific paths (e.g., /api/admin/*).
 */
export default defineEventHandler(async (event) => {
  // This middleware should only run for specific protected routes, e.g., under /api/admin
  if (!event.path.startsWith('/api/admin')) {
    return;
  }

  let payload;

  try {
    payload = authGuard(event);
  } catch (error) {
    return sendError(
      event,
      createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Missing or invalid token.',
      }),
    );
  }

  let user: Awaited<ReturnType<typeof userRepository.findById>>;
  try {
    user = await userRepository.findById(payload.userId);
  } catch (error) {
    // An unguarded database call here turned a database outage into an unhandled
    // rejection, which killed the dev server instead of returning a response.
    console.error('[Auth Middleware] User lookup failed:', error instanceof Error ? error.message : String(error));
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable: Cannot verify the session right now.',
    });
  }

  if (!user) {
    return sendError(
      event,
      createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: User not found.',
      }),
    );
  }

  // Attach user to the event context for use in protected API routes
  event.context.user = user;
});
