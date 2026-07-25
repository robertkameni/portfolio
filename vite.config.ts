import { defineConfig } from 'vite';
import analog from '@analogjs/platform';

const isWindows = process.platform === 'win32';

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
        : { discover: false, routes: ['/'] },
      nitro: {
        preset: 'vercel',
        // Spec/test files under src/server must not be scanned as API routes.
        ignore: ['**/*.{spec,test}.ts'],
        output: {
          dir: '.vercel/output',
          publicDir: '.vercel/output/static',
        },
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
  },
}));
