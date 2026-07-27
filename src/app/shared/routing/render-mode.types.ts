import type { RouteMeta } from '@analogjs/router';

/** Hybrid rendering mode documented on each route; enforced at build time via vite.config.ts. */
export type AppRenderMode = 'prerender' | 'server' | 'client';

export type RouteMetaWithRenderMode = RouteMeta & { renderMode?: AppRenderMode; };

export function withRenderMode(renderMode: AppRenderMode, meta: RouteMeta = {}): RouteMetaWithRenderMode {
  return { ...meta, renderMode };
}
