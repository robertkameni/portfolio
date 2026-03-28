import {createError, defineEventHandler, readBody} from 'h3';
import {CreateProjectDto, projectRepository} from '../../../db/repositories/project.repository';

/**
 * API endpoint to create a new project.
 * This route is protected by the auth middleware, which runs because it's in the /api/admin directory.
 * The authenticated user is available on `event.context.user`.
 */
export default defineEventHandler(async (event) => {
  // The auth middleware has already run and verified the user.
  // If the user was not authenticated, the request would have been rejected.
  if (!event.context.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'});
  }

  const body = await readBody<CreateProjectDto>(event);

  // Basic validation
  if (!body?.title || !body?.slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Title and slug are required.'
    });
  }

  try {
    return await projectRepository.create(body);
  } catch (error) {
    // Handle potential database errors, e.g., unique constraint violation on slug
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error: Could not create project.'
    });
  }
});
