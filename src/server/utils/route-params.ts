import { getRouterParam, type H3Event } from 'h3';
import { badRequest } from './api-errors';

export function requireRouterParam(event: H3Event, key: string, message: string): string {
  const value = getRouterParam(event, key);
  if (!value) {
    throw badRequest(message);
  }
  return value;
}

export function requireRouterParamFromAliases(event: H3Event, keys: string[], message: string): string {
  for (const key of keys) {
    const value = getRouterParam(event, key);
    if (value) {
      return value;
    }
  }

  throw badRequest(message);
}
