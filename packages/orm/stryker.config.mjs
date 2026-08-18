/**
 * Mutation testing config for @kiwa-lab/orm.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — ORM adapter targets
 * Prisma / Drizzle / Kysely expectation semantics; SQL dialect + query
 * planner drift expected across providers.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 *
 * Every implementation file (#1981). It mutated `expectations.js` alone before —
 * 100 lines of 5,134, and the last package in the repo still holding a single-entry
 * list.
 *
 * Widening it was blocked by runtime, not by score. The first attempt processed
 * 2,463 of 2,856 mutants in 11 minutes and then fell to 8 mutants per 90 seconds,
 * which #1981 traced to the two live-container test files rather than to the
 * semantics layer. `vitest.stryker.config.mjs` records that measurement and the
 * reason they are excluded from mutation runs; they still run under `pnpm test`.
 *
 * The widened run takes 11m28s and measures 76.94 % covered MSI over 2,856 mutants,
 * which puts it between `observability` (5m18s) and `auth` (15m52s) rather than in
 * a class of its own. The 341 no-coverage mutants are the honest residue: 295 of
 * them sit in `setup-orm-env.js`, whose driver-wiring branches no fast test reaches.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/expectations.js',
    '.vitest-dist/src/semantics/binlog.js',
    '.vitest-dist/src/semantics/cdc.js',
    '.vitest-dist/src/semantics/connection-pool.js',
    '.vitest-dist/src/semantics/fidelity.js',
    '.vitest-dist/src/semantics/fts5.js',
    '.vitest-dist/src/semantics/logical-replication-advanced.js',
    '.vitest-dist/src/semantics/logical-replication.js',
    '.vitest-dist/src/semantics/mvcc-advanced.js',
    '.vitest-dist/src/semantics/mvcc.js',
    '.vitest-dist/src/semantics/mysql-cluster.js',
    '.vitest-dist/src/semantics/partitioning.js',
    '.vitest-dist/src/semantics/pool-advanced.js',
    '.vitest-dist/src/semantics/replication.js',
    '.vitest-dist/src/semantics/rls.js',
    '.vitest-dist/src/semantics/sqlite-wal.js',
    '.vitest-dist/src/semantics/transaction-orchestrator.js',
    '.vitest-dist/src/semantics/txn-isolation.js',
    '.vitest-dist/src/semantics/types.js',
    '.vitest-dist/src/semantics/vector-store.js',
    '.vitest-dist/src/setup-orm-env.js',
    '.vitest-dist/src/types.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
