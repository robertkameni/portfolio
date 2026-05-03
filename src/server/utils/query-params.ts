import { getQuery, type H3Event } from 'h3';

export function getSingleQueryString(event: H3Event, key: string): string | undefined {
  const value = getQuery(event)[key];
  return typeof value === 'string' ? value : undefined;
}

export function queryEquals(event: H3Event, key: string, expected: string): boolean {
  return getSingleQueryString(event, key) === expected;
}
