import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['.vitest-dist/tests/setup-component-env.test.js', '.vitest-dist/tests/vue.test.js'],
    environment: 'jsdom',
  },
});
