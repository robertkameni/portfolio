import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3';
import { projectRepository } from '../../db/repositories/project.repository';
import { authGuard } from '../../utils/authGuard';

/**
 * Public API endpoint to fetch a single published project by its slug.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Slug parameter is missing.',
    });
  }

  const query = getQuery(event);
  const previewMode = query['preview'] === 'admin';

  if (previewMode) {
    authGuard(event);
  }

  let project;
  try {
    project = previewMode ? await projectRepository.findBySlug(slug) : await projectRepository.findPublishedBySlug(slug);
  } catch (dbError) {
    console.error('Database error fetching project by slug:', dbError);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    });
  }

  // Handle the "not found" case as part of the normal logic flow,
  // AFTER the database call has succeeded.
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found: Project not found.',
    });
  }

  return project;
});
