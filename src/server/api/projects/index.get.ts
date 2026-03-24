import {createError, defineEventHandler} from 'h3';
import {projectRepository} from '../../db/repositories/project.repository';

/**
 * Public API endpoint to fetch all published projects.
 * This route is not protected by authentication.
 */
export default defineEventHandler(async (event) => {
  try {
    return await projectRepository.findAllPublished();
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error: Could not fetch projects.',
    });
  }
});
