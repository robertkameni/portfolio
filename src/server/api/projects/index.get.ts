import { defineEventHandler, setResponseHeader } from 'h3';
import { projectRepository } from '../../db/repositories/project.repository';
import { apiSuccess } from '../../utils/api-response';

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  try {
    const projects = await projectRepository.findAllPublished();
    return apiSuccess(projects, 'Published projects fetched.', 'PROJECTS_FETCHED');
  } catch (error) {
    console.error('[Projects] DB error, returning empty list:', error);
    return apiSuccess([], 'Projects unavailable.', 'PROJECTS_FETCHED');
  }
});
