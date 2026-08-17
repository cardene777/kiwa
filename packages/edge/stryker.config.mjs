/**
 * Mutation testing config for @kiwa-lab/edge.
 * Threshold: Framework tier (high 70 / low 60 / break 50) — Workers / Deno / Bun edge runtimes with divergent APIs.
 * SSOT: docs/quality/mutation-thresholds.md § Framework tier.
 *
 * Every implementation file (#1971). Until then the list held
 * `invoke-edge-handler.js` and `kv-mock.js` — 206 lines of 3,008 — and the
 * whole Workers semantics layer sat outside: Durable Object state, KV eventual
 * consistency, R2 multipart, D1 read replicas, CPU and subrequest limits,
 * WebSocket hibernation, cron triggers, cold starts, geo replication, global
 * routing, and streaming responses.
 *
 * That layer had 18 test files and 100 % line and branch coverage on every one
 * of its 18 sources, and no mutant had ever been thrown at it.
 *
 * Nothing is left out. `scripts/mutation-scope-report.mjs` classifies this
 * package as 3,008 implementation lines, 146 barrel lines, and no type-only
 * file, so the barrels are the whole of what stays off this list.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/invoke-edge-handler.js',
    '.vitest-dist/src/kv-mock.js',
    '.vitest-dist/src/semantics/cold-start.js',
    '.vitest-dist/src/semantics/cpu-time-limit.js',
    '.vitest-dist/src/semantics/cron-trigger.js',
    '.vitest-dist/src/semantics/d1-read-replica.js',
    '.vitest-dist/src/semantics/do-state-migration.js',
    '.vitest-dist/src/semantics/durable-object.js',
    '.vitest-dist/src/semantics/edge-kv.js',
    '.vitest-dist/src/semantics/fidelity.js',
    '.vitest-dist/src/semantics/geo-replicated.js',
    '.vitest-dist/src/semantics/global-routing.js',
    '.vitest-dist/src/semantics/kv-eventual-consistency.js',
    '.vitest-dist/src/semantics/middleware-chain.js',
    '.vitest-dist/src/semantics/r2-multipart.js',
    '.vitest-dist/src/semantics/streaming-response.js',
    '.vitest-dist/src/semantics/subrequest-limit.js',
    '.vitest-dist/src/semantics/types.js',
    '.vitest-dist/src/semantics/websocket-edge.js',
    '.vitest-dist/src/semantics/websocket-hibernation.js',
  ],
  thresholds: { high: 70, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
