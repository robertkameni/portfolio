import { defineEventHandler } from 'h3';
import { projectRepository } from '../../../db/repositories/project.repository';
import { adminGuard } from '../../../utils/authGuard';
import { notFound, withApiErrorHandling } from '../../../utils/api-errors';
import { getSingleQueryString } from '../../../utils/query-params';
import { apiSuccess } from '../../../utils/api-response';

/**
 * Admin API – fetch all projects (published + drafts).
 * When ?slug=<value> is provided, returns a single project instead.
 * Protected by the auth middleware.
 */
export default defineEventHandler(async (event) => {
  adminGuard(event);

  const slug = getSingleQueryString(event, 'slug');

  if (slug) {
    const project = await projectRepository.findBySlug(slug);
    if (!project) {
      throw notFound(`Project not found: ${slug}`);
    }
    return apiSuccess(project, 'Project fetched.', 'ADMIN_PROJECT_FETCHED');
  }

  const projects = await withApiErrorHandling(() => projectRepository.findAll(), 'Internal Server Error: Could not fetch projects.');

  return apiSuccess(projects, 'Projects fetched.', 'ADMIN_PROJECTS_FETCHED');
});
