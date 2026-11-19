import { describe, expect, it } from 'vitest';
import { siteAbsoluteUrl } from './site-absolute-url';

describe('siteAbsoluteUrl', () => {
  it('returns origin + trailing slash for root path', () => {
    expect(siteAbsoluteUrl('/')).toBe('https://cv.lucastar.de/');
  });

  it('returns origin + trailing slash for empty path', () => {
    expect(siteAbsoluteUrl('')).toBe('https://cv.lucastar.de/');
  });

  it('returns origin + /cv for /cv', () => {
    expect(siteAbsoluteUrl('/cv')).toBe('https://cv.lucastar.de/cv');
  });

  it('prepends slash when path does not start with one', () => {
    expect(siteAbsoluteUrl('cv')).toBe('https://cv.lucastar.de/cv');
  });

  it('accepts a custom origin', () => {
    expect(siteAbsoluteUrl('/cv', 'https://example.com')).toBe('https://example.com/cv');
  });

  it('uses default origin https://cv.lucastar.de', () => {
    expect(siteAbsoluteUrl('/projects')).toBe('https://cv.lucastar.de/projects');
  });
});
