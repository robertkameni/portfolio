import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import { discoverPrerenderRoutes } from './scripts/discover-prerender-routes';
import { CLIENT_ONLY_ROUTE_RULES } from './src/app/shared/routing/hybrid-render.config';

const isWindows = process.platform === 'win32';
const analyzeBundles = process.env['ANALYZE'] === 'true' || process.env['ANALYZE'] === '1';
const prerenderRoutes = isWindows ? [] : await discoverPrerenderRoutes();

const analyzePlugins = analyzeBundles
  ? [
      (await import('rollup-plugin-visualizer')).visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
    ]
  : [];

if (isWindows) {
  console.warn(
    '[prerender] Windows build: prerendering is skipped locally. Use WSL or CI (Linux) to validate static routes. See README → Platform Notes.',
  );
}

export default defineConfig(({ mode }) => ({
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    ...analyzePlugins,
    analog({
      prerender: isWindows
        ? { discover: false, routes: [] }
        : { discover: false, routes: prerenderRoutes },
      nitro: {
        preset: 'vercel',
        ignore: ['**/*.{spec,test}.ts'],
        routeRules: CLIENT_ONLY_ROUTE_RULES,
        externals: {
          inline: [
            'sanitize-html',
            'htmlparser2',
            'domhandler',
            'domutils',
            'dom-serializer',
            'domelementtype',
            'entities',
            'escape-string-regexp',
            'is-plain-object',
          ],
        },
        output: {
          dir: '.vercel/output',
          publicDir: '.vercel/output/static',
        },
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
    server: {
      deps: {
        inline: ['sanitize-html', 'htmlparser2', 'escape-string-regexp', 'is-plain-object'],
        fallbackCJS: true,
      },
    },
  },
}));
