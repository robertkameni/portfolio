import 'dotenv/config';
import { PrismaClient } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const BASE_PUBLIC_ROUTES = ['/', '/projects'] as const;

/**
 * Builds the static prerender route list for public pages.
 * Admin routes are excluded by design (only explicit public paths are returned).
 */
export async function discoverPrerenderRoutes(): Promise<string[]> {
  const databaseUrl = process.env['DATABASE_URL']?.trim();
  if (!databaseUrl) {
    console.warn('[prerender] DATABASE_URL is not set; prerendering base public routes only.');
    return [...BASE_PUBLIC_ROUTES];
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const projects = await prisma.project.findMany({
      where: { isPublished: true },
      select: { slug: true },
      orderBy: { createdAt: 'desc' },
    });

    const projectRoutes = projects.map((project) => `/projects/${project.slug}`);
    const routes = [...BASE_PUBLIC_ROUTES, ...projectRoutes];

    console.info(`[prerender] Discovered ${routes.length} public routes (${projectRoutes.length} project slugs).`);
    return routes;
  } catch (error) {
    console.warn('[prerender] Failed to discover project slugs from database; using base routes only.', error);
    return [...BASE_PUBLIC_ROUTES];
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
