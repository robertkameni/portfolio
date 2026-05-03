import { defineEventHandler } from 'h3';
import { projectRepository } from '../../../db/repositories/project.repository';
import { adminGuard } from '../../../utils/authGuard';
import { requireRouterParam } from '../../../utils/route-params';
import { withApiErrorHandling } from '../../../utils/api-errors';
import { apiAck } from '../../../utils/api-response';

export default defineEventHandler(async (event) => {
  const projectId = requireRouterParam(event, 'id', 'Bad Request: Project ID is required.');
  adminGuard(event);

  return withApiErrorHandling(
    async () => {
      await projectRepository.deleteById(projectId);
      return apiAck('Project deleted.', 'ADMIN_PROJECT_DELETED');
    },
    'Internal Server Error: Unable to delete project.',
    { logMessage: 'Could not delete project' },
  );
});
