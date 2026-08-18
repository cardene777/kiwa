/**
 * Mutation testing config for @kiwa-lab/realtime.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — realtime adapter
 * covers Ably / Pusher / Socket.IO with fidelity report + connection mocks;
 * provider WebSocket API drift is expected.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 *
 * Every implementation file (#1980). It mutated `engine.js` / `fidelity.js` /
 * `ably.js` before — 877 lines of 4,827 — and measures 69.41 % over 2,409
 * mutants widened, up from 67.54.
 *
 * **The three exclusions were wrong.** `pusher.js` and `socketio.js` were left
 * out as needing a live provider socket, and `report.js` as a thin adapter
 * already mutation-tested inside `@kiwa-lab/quality-metrics`. Measured, they
 * hold 119 / 137 / 67 covered mutants against 2 / 2 / 0 no-coverage. The
 * "already tested elsewhere" argument fails the same way: the adapter's own
 * branches are not the ones quality-metrics runs.
 *
 * Eight files across three packages have been excluded on this reasoning and
 * measured since: `cache` (#1967, three files), `queue` (#1980, two) and this
 * one (#1980, three). None of the eight had zero covered mutants. The argument
 * is appealing because it sounds like it protects the score, but `covered MSI`
 * drops no-coverage mutants from its denominator, so excluding a file can only
 * hide work — never protect a number.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/ably.js',
    '.vitest-dist/src/engine.js',
    '.vitest-dist/src/fidelity.js',
    '.vitest-dist/src/pusher.js',
    '.vitest-dist/src/real-driver.js',
    '.vitest-dist/src/report.js',
    '.vitest-dist/src/semantics-fidelity.js',
    '.vitest-dist/src/semantics/http3-push.js',
    '.vitest-dist/src/semantics/moq-datagram-media.js',
    '.vitest-dist/src/semantics/moq-fetch.js',
    '.vitest-dist/src/semantics/quic-multiplex.js',
    '.vitest-dist/src/semantics/realtime-ai-inference.js',
    '.vitest-dist/src/semantics/session-orchestrator.js',
    '.vitest-dist/src/semantics/simulcast-svc.js',
    '.vitest-dist/src/semantics/types.js',
    '.vitest-dist/src/semantics/voice-streaming.js',
    '.vitest-dist/src/semantics/webcodecs-decoder.js',
    '.vitest-dist/src/semantics/webcodecs-encoder.js',
    '.vitest-dist/src/semantics/webrtc-data-channel.js',
    '.vitest-dist/src/semantics/webrtc-ice.js',
    '.vitest-dist/src/semantics/webrtc-signaling.js',
    '.vitest-dist/src/semantics/webrtc-track.js',
    '.vitest-dist/src/semantics/webtransport-bi.js',
    '.vitest-dist/src/semantics/webtransport-uni.js',
    '.vitest-dist/src/semantics/whisper-streaming.js',
    '.vitest-dist/src/socketio.js',
    '.vitest-dist/src/supabase.js',
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
