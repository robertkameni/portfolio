import {createError, defineEventHandler, getRouterParam} from 'h3';
import {projectRepository} from '../../../db/repositories/project.repository';

/**
 * Admin-only endpoint to fetch any project by slug (published or draft).
 * Protected by the global auth middleware (/api/admin/*).
 */
export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'});
  }

  // Try both param names – Nitro uses the filename ([id]) but a cached
  // dev-server entry from the old [slug].get.ts may still use 'slug'.
  const slug = getRouterParam(event, 'id') ?? getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({statusCode: 400, statusMessage: 'Slug is required'});
  }

  const project = await projectRepository.findBySlug(slug);
  if (!project) {
    throw createError({statusCode: 404, statusMessage: 'Project not found'});
  }

  return project;
});
