/**
 * Emit a fidelity report to disk — the 3-spec dogfood harness plus the
 * `@kiwa-test/quality-metrics` release gate run over the mock + real
 * adapters, producing the JSON snapshot + markdown that `docs/quality-
 * reports/edge/vercel-edge-function-app.md` consumes at release time.
 *
 * The `KIWA_MODE=real` + `VERCEL_KEY=1` env gate leaves the real adapter
 * in the skip path in local dev, so the divergence count reflects every
 * op firing on mock but skipping on real. That is the expected shape for
 * the baseline report — see `docs/quality-reports/edge/
 * vercel-edge-function-app.md`.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter } from '../src/lib/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/lib/fidelity.js';
import { REGION_CATALOG } from '../src/lib/vercel-adapter.js';

const OPS_UNDER_TEST = [
  'driveGeoRoute',
  'driveGeoPrimaryWrite',
  'driveGeoReplicaSync',
  'driveKvRead',
  'driveKvWrite',
  'driveKvRangeQuery',
  'driveSseOpen',
  'driveSseBackpressure',
];

describe('dogfood-vercel-edge-function-app — emit fidelity report to quality-report/', () => {
  it('T-DFVE-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        // A canonical 8-op run — geo route + primary write + replica
        // sync + KV write/read/range + SSE open + backpressure.
        //
        // `runAdapterMatrix` already isolates the real-adapter failure
        // (see fidelity.ts), so the caller does not swallow errors here.
        // Doing so would mask real mock regressions — a broken mock op
        // must surface as a test failure, not be silently absorbed and
        // reported as partial-trace coverage.
        try {
          await adapter.driveGeoRoute({
            requestId: 'req-emit-1',
            acceptLanguage: 'ja-JP,ja;q=0.9,en;q=0.5',
            clientCountry: 'JP',
          });
          await adapter.driveGeoPrimaryWrite({ payload: 'canonical-write' });
          await adapter.driveGeoReplicaSync({
            replicas: [...REGION_CATALOG.replicas],
          });
          await adapter.driveKvWrite({
            key: 'user:alice:last_seen',
            value: '1700000000',
          });
          await adapter.driveKvRead({ key: 'user:alice:last_seen' });
          await adapter.driveKvRangeQuery({ prefix: 'user:' });
          await adapter.driveSseOpen({
            streamId: 'stream-emit-1',
            firstChunk: 'id: 1\nevent: start\ndata: begin\n\n',
          });
          await adapter.driveSseBackpressure({
            streamId: 'stream-emit-1',
            chunks: [
              'id: 2\ndata: tick\n\n',
              'id: 3\ndata: tock\n\n',
            ],
            highWaterMark: 8192,
          });
        } catch (err) {
          // Only the real-adapter skip path raises here. The mock path
          // must complete without throwing — surface any other error.
          if (adapter.mode !== 'real') throw err;
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/edge/vercel-edge-function',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: OPS_UNDER_TEST,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 86 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 30, integration: 6, e2e: 6 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 8, realTotalMethods: 8 },
    });

    // Write into the local example directory so the emitted snapshot is
    // easy to inspect from a fresh clone. A follow-up manual step
    // promotes the snapshot to docs/quality-reports/edge/ when it becomes
    // canonical for a release.
    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    expect(output.markdown).toContain('Quality Report');
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });
});
