import { z } from 'zod';

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DEEPSEEK_API_KEY: z.string().min(1, 'DEEPSEEK_API_KEY is required'),
  ACCESS_TOKEN_SECRET: z.string().min(1, 'ACCESS_TOKEN_SECRET is required'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'REFRESH_TOKEN_SECRET is required'),
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET is required'),
  REALTIME_SESSION_TOKEN_SECRET: z.string().min(1, 'REALTIME_SESSION_TOKEN_SECRET is required'),
  UPSTASH_REDIS_URL: z.string().optional(),
});

export function validateServerEnv(): void {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Server environment validation failed. Missing or invalid variables: ${missing}`);
  }
}

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

export function readOptionalEnv(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

export type CalcomConfig = {
  apiKey: string;
  eventTypeId: number;
  username?: string;
};

export function getCalcomConfig(): CalcomConfig | null {
  const apiKey = readOptionalEnv('CALCOM_API_KEY');
  const eventTypeIdRaw = readOptionalEnv('CALCOM_EVENT_TYPE_ID');
  const username = readOptionalEnv('CALCOM_USERNAME');

  if (!apiKey || !eventTypeIdRaw) {
    return null;
  }

  const eventTypeId = Number.parseInt(eventTypeIdRaw, 10);
  if (!Number.isFinite(eventTypeId) || eventTypeId <= 0) {
    return null;
  }

  return { apiKey, eventTypeId, username };
}

export function isCalcomConfigured(): boolean {
  return getCalcomConfig() !== null;
}

export function assertCalcomConfigured(): CalcomConfig {
  const config = getCalcomConfig();
  if (!config) {
    throw new Error('Cal.com is not configured. Set CALCOM_API_KEY and CALCOM_EVENT_TYPE_ID.');
  }
  return config;
}

// ─── Resend (email notifications) ────────────────────────────────────────────

export type ResendConfig = {
  apiKey: string;
  notificationEmail: string;
  fromEmail: string;
};

export function getResendConfig(): ResendConfig | null {
  const apiKey = readOptionalEnv('RESEND_API_KEY');
  if (!apiKey) {
    return null;
  }
  const notificationEmail = readOptionalEnv('NOTIFICATION_EMAIL');
  const fromEmail = readOptionalEnv('RESEND_FROM_EMAIL');
  if (!notificationEmail || !fromEmail) {
    return null;
  }
  return { apiKey, notificationEmail, fromEmail };
}

export function isResendConfigured(): boolean {
  return getResendConfig() !== null;
}
