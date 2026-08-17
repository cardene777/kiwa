/**
 * Mutation testing config for @kiwa-lab/search.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — search adapter covers
 * Algolia / Meilisearch / Typesense with provider-specific index + query
 * fidelity.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 *
 * Every implementation file (#1969). Until then the list held the three
 * provider adapters and the engine — 286 lines of 2,465 — and the whole
 * semantics layer built after v0.2 sat outside at 98-100 % line coverage that
 * nothing had tried to break.
 *
 * Nothing is left out. `scripts/mutation-scope-report.mjs` classifies this
 * package as 2,465 implementation lines, 158 barrel lines, and 39 type-only
 * lines (`src/types.ts`), so the barrels and the type file are the whole of
 * what stays off this list. `real-driver.js` carries an env gate and is
 * mutated like the rest; whatever of it the unit suite does not reach lands as
 * no-coverage, which the covered score leaves out of the denominator.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/engine.js',
    '.vitest-dist/src/algolia.js',
    '.vitest-dist/src/meilisearch.js',
    '.vitest-dist/src/typesense.js',
    '.vitest-dist/src/real-driver.js',
    '.vitest-dist/src/semantics/faceted-advanced.js',
    '.vitest-dist/src/semantics/fidelity.js',
    '.vitest-dist/src/semantics/geo.js',
    '.vitest-dist/src/semantics/index-management.js',
    '.vitest-dist/src/semantics/query-dsl.js',
    '.vitest-dist/src/semantics/query-orchestrator.js',
    '.vitest-dist/src/semantics/relevance.js',
    '.vitest-dist/src/semantics/semantic.js',
    '.vitest-dist/src/semantics/synonym-advanced.js',
    '.vitest-dist/src/semantics/types.js',
    '.vitest-dist/src/semantics/vector.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
