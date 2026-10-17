import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';
import { fileURLToPath } from 'node:url';

// SWC emite la metadata de decoradores que la inyección de dependencias de Nest necesita.
export default defineConfig({
  plugins: [tsconfigPaths(), swc.vite({ module: { type: 'es6' } })],
  resolve: {
    alias: {
      '@app/common': fileURLToPath(new URL('./libs/common/src/index.ts', import.meta.url)),
      '@app/fixtures': fileURLToPath(new URL('./libs/fixtures/src/index.ts', import.meta.url)),
    },
  },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

  },
});
