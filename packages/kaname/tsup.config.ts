import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['vitest'],
  },
  {
    // The command resolves `templates/` through `import.meta.url`, which has no
    // CommonJS equivalent, so it ships as ESM only. `bin` points straight at it.
    entry: ['src/bin.ts'],
    format: ['esm'],
    dts: false,
    clean: false,
    sourcemap: true,
    external: ['vitest'],
  },
]);
