import { defineEventHandler, setResponseHeader } from 'h3';
import { projectRepository } from '../../db/repositories/project.repository';
import { apiSuccess } from '../../utils/api-response';
import { serviceUnavailable } from '../../utils/api-errors';

export default defineEventHandler(async (event) => {
  // Keep the last successful query (good for repeat traffic) separately from the
  // failure path: a cached empty list would keep the site looking empty long
  // after the database recovered.
  setResponseHeader(event, 'Cache-Control', 'no-store');

  try {
    const projects = await projectRepository.findAllPublished();
    setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return apiSuccess(projects, 'Published projects fetched.', 'PROJECTS_FETCHED');
  } catch (error) {
    console.error('[Projects] DB error, cannot list projects:', error);

    // Reporting 200 with an empty list made an outage indistinguishable from
    // "nothing published" in the UI, so a real failure now surfaces as one.
    throw serviceUnavailable('Projects are temporarily unavailable.', 'PROJECTS_UNAVAILABLE');
  }
});
