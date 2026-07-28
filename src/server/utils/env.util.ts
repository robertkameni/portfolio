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
