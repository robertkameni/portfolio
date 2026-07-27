import type { AppRenderMode } from './render-mode.types';

/**
 * Central hybrid rendering map consumed by vite.config.ts (prerender + Nitro routeRules).
 * Keep in sync with routeMeta.renderMode on each page file.
 */
export const HYBRID_RENDER_ROUTES: ReadonlyArray<{ path: string; mode: AppRenderMode }> = [
  { path: '/', mode: 'server' },
  { path: '/projects', mode: 'prerender' },
  { path: '/projects/*', mode: 'prerender' },
  { path: '/admin/**', mode: 'client' },
  { path: '/projects/*/edit', mode: 'client' },
];

/** Nitro routeRules: client-only (no SSR shell generation). */
export const CLIENT_ONLY_ROUTE_RULES: Record<string, { ssr: false }> = {
  '/admin/**': { ssr: false },
  '/projects/**/edit': { ssr: false },
};
