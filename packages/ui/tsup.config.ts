import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    'react',
    'react-dom',
    'react-dom/server',
    '@testing-library/react',
    '@testing-library/user-event',
    '@testing-library/svelte',
    '@playwright/test',
    'playwright',
    '@vue/test-utils',
    'vue',
    'svelte',
    'jsdom',
    'vitest',
  ],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
