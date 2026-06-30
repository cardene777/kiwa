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
    'mysql2',
    'testcontainers',
    '@testcontainers/postgresql',
    '@testcontainers/mysql',
  ],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
