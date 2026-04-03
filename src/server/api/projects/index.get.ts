import { defineEventHandler } from 'h3';
import { projectRepository } from '../../db/repositories/project.repository';
import { withApiErrorHandling } from '../../utils/api-errors';
import { apiSuccess } from '../../utils/api-response';

/**
 * Public API endpoint to fetch all published projects.
 * This route is not protected by authentication.
 */
export default defineEventHandler(async () => {
  const projects = await withApiErrorHandling(
    () => projectRepository.findAllPublished(),
    'Internal Server Error: Could not fetch projects.'
  );

  return apiSuccess(projects, 'Published projects fetched.', 'PROJECTS_FETCHED');
});
