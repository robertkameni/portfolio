import { defineEventHandler, readBody } from 'h3';
import { CreateProjectDto, projectRepository } from '../../../db/repositories/project.repository';
import { adminGuard } from '../../../utils/authGuard';
import { badRequest, withApiErrorHandling } from '../../../utils/api-errors';
import { apiSuccess } from '../../../utils/api-response';
import { hasRequiredStringFields } from '../../../utils/request-validation';

/**
 * API endpoint to create a new project.
 * This route is protected by the auth middleware, which runs because it's in the /api/admin directory.
 * The authenticated user is available on `event.context.user`.
 */
export default defineEventHandler(async (event) => {
  adminGuard(event);

  const body = await readBody<CreateProjectDto>(event);

  // Basic validation
  if (!hasRequiredStringFields(body, ['title', 'slug'])) {
    throw badRequest('Bad Request: Title and slug are required.');
  }

  const project = await withApiErrorHandling(
    () => projectRepository.create(body),
    'Internal Server Error: Could not create project.'
  );

  return apiSuccess(project, 'Project created.', 'ADMIN_PROJECT_CREATED');
});
