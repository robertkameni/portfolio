import { PrismaClient } from '../../../prisma/generated/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {Pool} from 'pg';

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalWithPrisma = globalThis as GlobalWithPrisma;

let pool: Pool | undefined;
let poolShutdownRegistered = false;

function ensurePool(): Pool {
  if (pool) {
    return pool;
  }

  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to initialize PrismaClient.');
  }

  const newPool = new Pool({
    connectionString: databaseUrl,
    allowExitOnIdle: true
  });

  newPool.on('error', (error) => {
    console.error('Prisma PostgreSQL pool error:', error);
  });

  pool = newPool;
  registerPoolShutdown();
  return pool;
}

function createPrismaClient(): PrismaClient {
  const prismaPool = ensurePool();
  const adapter = new PrismaPg(prismaPool);
  return new PrismaClient({
    adapter
  });
}

function registerPoolShutdown(): void {
  if (poolShutdownRegistered) {
    return;
  }

  poolShutdownRegistered = true;

  const shutdown = (): void => {
    if (!pool) {
      return;
    }

    pool.end().catch((error) => {
      console.error('Fehler beim Beenden des Prisma-Pools:', error);
    });
  };

  process.once('beforeExit', shutdown);
}

function getPrismaClient(): PrismaClient {
  if (globalWithPrisma.prisma) {
    return globalWithPrisma.prisma;
  }

  const client = createPrismaClient();
  globalWithPrisma.prisma = client;
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
}) as PrismaClient;
