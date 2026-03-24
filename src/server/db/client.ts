import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {Pool} from "pg";

// This is the new, recommended way to instantiate Prisma Client in serverless environments.
// It uses a connection pool to avoid exhausting the database's connection limit.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a connection pool.
const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
