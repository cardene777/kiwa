import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/perf/**/*.perf.{ts,tsx}'],
    environment: 'jsdom',
  },
});
