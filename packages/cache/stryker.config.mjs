/**
 * Mutation testing config for @kiwa-lab/cache.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — provider adapters over
 * Redis / KeyDB / Memcached, where mocks approximate a live server.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 *
 * Every implementation file (#1967). Until then only `in-memory-cache.js` was
 * mutated — 327 lines of 2,411 — and the three provider trees, the lifecycle
 * orchestrator, and the env setup helpers all sat outside.
 *
 * The three `testcontainers-*.js` files are in scope. The old config left them
 * out on the grounds that their assertions only fire against a live container,
 * citing a v1.27-3 sweep that measured 0 covered mutants. Measured now, that is
 * not what the suite does: 330 of their 345 mutants are covered, and the three
 * score 73.63 / 89.66 / 92.31 — the largest of them above the tier bar on its
 * own. Only 15 mutants land as no-coverage, and those stay out of the covered
 * denominator rather than counting against the package.
 *
 * Two mutants in that tree end as RuntimeError instead: mutating a connection
 * string makes the code dial a container that is not running, and the socket
 * error surfaces outside the test run (ECONNREFUSED / ECONNRESET). They are
 * counted in the total score and excluded from the covered one.
 *
 * The barrels (`index.js` at each level) stay off the list, per
 * § What goes in `mutate`.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/in-memory-cache.js',
    '.vitest-dist/src/setup-cache-env.js',
    '.vitest-dist/src/testcontainers-cache.js',
    '.vitest-dist/src/types.js',
    '.vitest-dist/src/keydb/setup-keydb-env.js',
    '.vitest-dist/src/keydb/stub-keydb.js',
    '.vitest-dist/src/keydb/testcontainers-keydb.js',
    '.vitest-dist/src/keydb/types.js',
    '.vitest-dist/src/memcached/setup-memcached-env.js',
    '.vitest-dist/src/memcached/stub-memcached.js',
    '.vitest-dist/src/memcached/testcontainers-memcached.js',
    '.vitest-dist/src/memcached/types.js',
    '.vitest-dist/src/semantics/cache-lifecycle-orchestrator.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
