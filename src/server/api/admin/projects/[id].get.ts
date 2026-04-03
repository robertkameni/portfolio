import {defineEventHandler} from 'h3';
import {projectRepository} from '../../../db/repositories/project.repository';
import {adminGuard} from '../../../utils/authGuard';
import {requireRouterParamFromAliases} from '../../../utils/route-params';
import {notFound} from '../../../utils/api-errors';
import {apiSuccess} from '../../../utils/api-response';

/**
 * Admin-only endpoint to fetch any project by slug (published or draft).
 * Protected by the global auth middleware (/api/admin/*).
 */
export default defineEventHandler(async (event) => {
  adminGuard(event);

  // Try both param names – Nitro uses the filename ([id]) but a cached
  // dev-server entry from the old [slug].get.ts may still use 'slug'.
  const slug = requireRouterParamFromAliases(event, ['id', 'slug'], 'Slug is required');

  const project = await projectRepository.findBySlug(slug);
  if (!project) {
    throw notFound(`Project not found: ${slug}`);
  }

  return apiSuccess(project, 'Project fetched.', 'ADMIN_PROJECT_FETCHED');
});
