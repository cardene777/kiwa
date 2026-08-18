import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['.vitest-dist/tests/**/*.test.js'],
    exclude: ['**/.stryker-tmp/**'],
    environment: 'node',
    testTimeout: 15000,
  },
});
