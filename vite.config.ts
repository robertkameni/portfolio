import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import { discoverPrerenderRoutes } from './scripts/discover-prerender-routes';

const isWindows = process.platform === 'win32';
const prerenderRoutes = isWindows ? [] : await discoverPrerenderRoutes();

export default defineConfig(({ mode }) => ({
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    analog({
      prerender: isWindows
        ? { discover: false, routes: [] }
        : { discover: false, routes: prerenderRoutes },
      nitro: {
        preset: 'vercel',
        // Spec/test files under src/server must not be scanned as API routes.
        ignore: ['**/*.{spec,test}.ts'],
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
