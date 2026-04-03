type AnyRecord = Record<string, unknown>;

export function hasRequiredFields<T extends AnyRecord, K extends keyof T>(
  body: T | null | undefined,
  keys: readonly K[]
): body is T & { [P in K]-?: NonNullable<T[P]> } {
  if (!body || typeof body !== 'object') {
    return false;
  }

  return keys.every((key) => body[key] !== null && body[key] !== undefined);
}

export function hasRequiredStringFields<T extends AnyRecord, K extends keyof T>(
  body: T | null | undefined,
  keys: readonly K[]
): body is T & { [P in K]-?: string } {
  if (!body || typeof body !== 'object') {
    return false;
  }

  return keys.every((key) => {
    const value = body[key];
    return typeof value === 'string' && value.length > 0;
  });
}

