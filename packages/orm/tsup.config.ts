import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    'vitest',
    'better-sqlite3',
    'drizzle-orm',
    'postgres',
    'testcontainers',
    '@testcontainers/postgresql',
  ],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
