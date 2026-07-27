import { defineEventHandler, readBody } from 'h3';
import { CreateProjectDto, projectRepository } from '../../../db/repositories/project.repository';
import { adminGuard } from '../../../utils/authGuard';
import { badRequest, withApiErrorHandling } from '../../../utils/api-errors';
import { apiSuccess } from '../../../utils/api-response';
import { hasRequiredStringFields } from '../../../utils/request-validation';

function mapProjectWriteError(error: unknown): never {
  if (error instanceof Error && error.message.includes('disallowed HTML')) {
    throw badRequest(error.message);
  }

  throw error;
}

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

  const project = await withApiErrorHandling(async () => {
    try {
      return await projectRepository.create(body);
    } catch (error) {
      mapProjectWriteError(error);
    }
  }, 'Internal Server Error: Could not create project.');

  return apiSuccess(project, 'Project created.', 'ADMIN_PROJECT_CREATED');
});
