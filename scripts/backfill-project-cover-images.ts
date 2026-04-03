import 'dotenv/config';
import { PrismaClient } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { DEFAULT_PROJECT_COVER_IMAGE_BY_SLUG } from '../src/server/data/project-cover-images';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const slugs = Object.keys(DEFAULT_PROJECT_COVER_IMAGE_BY_SLUG);

  const projects = await prisma.project.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, coverImageUrl: true },
  });

  let updatedCount = 0;

  for (const project of projects) {
    const fallbackImage = DEFAULT_PROJECT_COVER_IMAGE_BY_SLUG[project.slug];
    const hasCoverImage = typeof project.coverImageUrl === 'string' && project.coverImageUrl.trim().length > 0;

    if (hasCoverImage || !fallbackImage) {
      continue;
    }

    const result = await prisma.project.updateMany({
      where: {
        id: project.id,
        OR: [{ coverImageUrl: null }, { coverImageUrl: '' }],
      },
      data: { coverImageUrl: fallbackImage },
    });

    updatedCount += result.count;
  }

  console.log(`✅ Backfilled ${updatedCount} project cover image(s).`);
}

main()
  .catch((error) => {
    console.error('❌ Failed to backfill project cover images.', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

