import { createError, defineEventHandler, readBody } from 'h3';
import { adminGuard } from '../../../utils/authGuard';
import { projectRepository, UpdateProjectDto } from '../../../db/repositories/project.repository';
import { requireRouterParam } from '../../../utils/route-params';

export default defineEventHandler(async (event) => {
  adminGuard(event);

  const projectId = requireRouterParam(event, 'id', 'Bad Request: Project ID is required.');

  const body = await readBody<UpdateProjectDto>(event);

  try {
    return await projectRepository.update(projectId, body);
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error: Unable to update project.',
    });
  }
});
