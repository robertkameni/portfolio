import { defineEventHandler } from 'h3';
import { projectRepository } from '../../db/repositories/project.repository';
import { authGuard } from '../../utils/authGuard';
import { requireRouterParam } from '../../utils/route-params';
import type { Project } from '../../../../prisma/generated/client';
import { notFound, withApiErrorHandling } from '../../utils/api-errors';
import { queryEquals } from '../../utils/query-params';
import { apiSuccess } from '../../utils/api-response';

/**
 * Public API endpoint to fetch a single published project by its slug.
 */
export default defineEventHandler(async (event) => {
  const slug = requireRouterParam(event, 'slug', 'Bad Request: Slug parameter is missing.');

  const previewMode = queryEquals(event, 'preview', 'admin');

  if (previewMode) {
    authGuard(event);
  }

  const project: Project | null = await withApiErrorHandling(
    () => (previewMode ? projectRepository.findBySlug(slug) : projectRepository.findPublishedBySlug(slug)),
    'Internal Server Error',
    { logMessage: 'Database error fetching project by slug:' }
  );

  // Handle the "not found" case as part of the normal logic flow,
  // AFTER the database call has succeeded.
  if (!project) {
    throw notFound('Not Found: Project not found.');
  }

  return apiSuccess(project, 'Project fetched.', 'PROJECT_FETCHED');
});
