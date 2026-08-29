import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import { CLIENT_ONLY_ROUTE_RULES } from './src/app/shared/routing/hybrid-render.config';

const analyzeBundles = process.env['ANALYZE'] === 'true' || process.env['ANALYZE'] === '1';

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
      // Public routes are server-rendered (SSR) and read the database at request
      // time, so no routes are statically prerendered during the build.
      prerender: { discover: false, routes: [] },
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
