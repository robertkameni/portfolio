import {createError, defineEventHandler} from 'h3';
import {projectRepository} from '../../../db/repositories/project.repository';

/**
 * API endpoint to fetch all projects (published and drafts).
 * This route is protected by the auth middleware.
 */
export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    return await projectRepository.findAll();
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error: Could not fetch projects.',
    });
  }
});
