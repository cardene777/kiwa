import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['.vitest-dist/tests/**/*.test.js'], environment: 'node', testTimeout: 30000 },
});
