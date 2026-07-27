import { z } from 'zod';

export function readPositiveIntFromEnv(name: string, fallback: number, minValue = 1): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < minValue) {
    return fallback;
  }

  return parsed;
}

const optionalNonEmptyString = z.string().trim().min(1).optional();

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL is required.'),
  ACCESS_TOKEN_SECRET: optionalNonEmptyString,
  REFRESH_TOKEN_SECRET: optionalNonEmptyString,
  UPSTASH_REDIS_URL: optionalNonEmptyString,
  REDIS_URL: optionalNonEmptyString,
  DEEPSEEK_API_KEY: optionalNonEmptyString,
  GEMINI_API_KEY: optionalNonEmptyString,
  REALTIME_SESSION_TOKEN_SECRET: optionalNonEmptyString,
  SESSION_SECRET: optionalNonEmptyString,
  JWT_SECRET: optionalNonEmptyString,
});

export type ServerEnv = z.infer<typeof baseEnvSchema>;

let cachedEnv: ServerEnv | null = null;

/** True when Nitro is generating static HTML — auth/redis are not used. */
function isPrerenderPhase(): boolean {
  return import.meta.prerender === true;
}

function isProductionRuntime(): boolean {
  if (isPrerenderPhase()) {
    return false;
  }

  return process.env['NODE_ENV'] === 'production';
}

function formatEnvValidationError(error: z.ZodError): string {
  const details = error.issues.map((issue) => `- ${issue.path.join('.') || 'env'}: ${issue.message}`).join('\n');
  return `[env] Invalid server environment configuration:\n${details}`;
}

export function validateServerEnv(force = false): ServerEnv {
  if (cachedEnv && !force) {
    return cachedEnv;
  }

  const parsed = baseEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(formatEnvValidationError(parsed.error));
  }

  const env = parsed.data;

  if (isProductionRuntime()) {
    const productionIssues: string[] = [];

    if (!env.ACCESS_TOKEN_SECRET) {
      productionIssues.push('- ACCESS_TOKEN_SECRET is required in production.');
    }
    if (!env.REFRESH_TOKEN_SECRET) {
      productionIssues.push('- REFRESH_TOKEN_SECRET is required in production.');
    }
    if (!env.UPSTASH_REDIS_URL && !env.REDIS_URL) {
      productionIssues.push('- UPSTASH_REDIS_URL or REDIS_URL is required in production.');
    }

    if (productionIssues.length > 0) {
      throw new Error(`[env] Invalid server environment configuration:\n${productionIssues.join('\n')}`);
    }
  }

  cachedEnv = env;
  return env;
}

export function getServerEnv(): ServerEnv {
  return validateServerEnv();
}
