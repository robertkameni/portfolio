import type { AppRenderMode } from './render-mode.types';

/**
 * Central hybrid rendering map consumed by vite.config.ts (prerender + Nitro routeRules).
 * Keep in sync with routeMeta.renderMode on each page file.
 *
 * Public routes use SSR (server) because they read from the database at request
 * time; prerendering them would require database access during the build.
 */
export const HYBRID_RENDER_ROUTES: ReadonlyArray<{ path: string; mode: AppRenderMode }> = [
  { path: '/', mode: 'server' },
  { path: '/projects', mode: 'server' },
  { path: '/projects/*', mode: 'server' },
  { path: '/admin/**', mode: 'client' },
  { path: '/projects/*/edit', mode: 'client' },
];

/** Nitro routeRules: client-only (no SSR shell generation). */
export const CLIENT_ONLY_ROUTE_RULES: Record<string, { ssr: false }> = {
  '/admin/**': { ssr: false },
  '/projects/**/edit': { ssr: false },
};
