import { defineEventHandler, readBody } from 'h3';
import { adminGuard } from '../../../utils/authGuard';
import { projectRepository, UpdateProjectDto } from '../../../db/repositories/project.repository';
import { requireRouterParam } from '../../../utils/route-params';
import { withApiErrorHandling } from '../../../utils/api-errors';
import { apiSuccess } from '../../../utils/api-response';

export default defineEventHandler(async (event) => {
  adminGuard(event);

  const projectId = requireRouterParam(event, 'id', 'Bad Request: Project ID is required.');

  const body = await readBody<UpdateProjectDto>(event);

  const project = await withApiErrorHandling(() => projectRepository.update(projectId, body), 'Internal Server Error: Unable to update project.');

  return apiSuccess(project, 'Project updated.', 'ADMIN_PROJECT_UPDATED');
});
