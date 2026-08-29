import { describe, expect, it } from 'vitest';
import type { AppRenderMode } from './render-mode.types';

/**
 * Anti-drift guard: every page that exports routeMeta.renderMode must match
 * the central HYBRID_RENDER_ROUTES map. When a page's renderMode diverges
 * from the map, this test fails — directing the developer to update the
 * central config, not just the per-page annotation.
 *
 * Pattern for page entries:
 *   [file path, expected renderMode]
 */
const PAGE_EXPECTATIONS: Array<{ path: string; mode: AppRenderMode }> = [
  { path: '../../pages/index.page', mode: 'server' },
  { path: '../../pages/projects/index.page', mode: 'server' },
  { path: '../../pages/projects/[slug]/index.page', mode: 'server' },
  { path: '../../pages/projects/[slug]/edit.page', mode: 'client' },
  { path: '../../pages/admin/login/index.page', mode: 'client' },
  { path: '../../pages/admin/(dashboard)/layout', mode: 'client' },
];

describe('hybrid-render.config — routeMeta anti-drift', () => {
  for (const entry of PAGE_EXPECTATIONS) {
    it(`${entry.path} → routeMeta.renderMode is "${entry.mode}"`, async () => {
      const mod = (await import(/* @vite-ignore */ entry.path)) as {
        routeMeta?: { renderMode?: string };
      };

      expect(mod.routeMeta, `${entry.path} must export routeMeta`).toBeDefined();
      expect(
        mod.routeMeta!.renderMode,
        `${entry.path} renderMode is "${mod.routeMeta!.renderMode}", expected "${entry.mode}" — update HYBRID_RENDER_ROUTES in hybrid-render.config.ts if the render mode changed intentionally`,
      ).toBe(entry.mode);
    });
  }
});
