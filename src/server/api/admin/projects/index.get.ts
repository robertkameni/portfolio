import { createError, defineEventHandler, getQuery } from 'h3';
import { projectRepository } from '../../../db/repositories/project.repository';

/**
 * Admin API – fetch all projects (published + drafts).
 * When ?slug=<value> is provided, returns a single project instead.
 * Protected by the auth middleware.
 */
export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const { slug } = getQuery(event) as { slug?: string };

  if (slug) {
    const project = await projectRepository.findBySlug(slug);
    if (!project) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found' });
    }
    return project;
  }

  try {
    return await projectRepository.findAll();
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error: Could not fetch projects.' });
  }
});
