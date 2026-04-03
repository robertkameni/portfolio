import { defineEventHandler, createError } from 'h3';
import { projectRepository } from '../../../db/repositories/project.repository';
import { adminGuard } from '../../../utils/authGuard';
import { requireRouterParam } from '../../../utils/route-params';

export default defineEventHandler(async (event) => {
  const projectId = requireRouterParam(event, 'id', 'Bad Request: Project ID is required.');

  try {
    adminGuard(event);
    await projectRepository.deleteById(projectId);
    return { status: 'ok' };
  } catch (error) {
    console.error('Could not delete project', error);
    const { statusCode, statusMessage } = (error as { statusCode?: number; statusMessage?: string }) ?? {};
    throw createError({
      statusCode: statusCode ?? 500,
      statusMessage: statusMessage ?? 'Internal Server Error: Unable to delete project.',
    });
  }
});
