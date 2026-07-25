// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resolveProjectApiUrl } from './project-api-url';

describe('resolveProjectApiUrl', () => {
  it('builds public and admin preview URLs', () => {
    expect(resolveProjectApiUrl({ slug: '', previewMode: false, clientReady: true })).toBeUndefined();
    expect(resolveProjectApiUrl({ slug: 'demo', previewMode: false, clientReady: true })).toBe('/api/projects/demo');
    expect(resolveProjectApiUrl({ slug: 'demo', previewMode: true, clientReady: false })).toBeUndefined();
    expect(resolveProjectApiUrl({ slug: 'demo', previewMode: true, clientReady: true })).toBe('/api/admin/projects?slug=demo');
  });
});
