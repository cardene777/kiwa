/**
 * Vitest — fidelity harness (v1.32-4).
 *
 * Drives all 5 ops against mock + real and asserts the fidelity harness
 * emits a coherent release-gate report.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { OPS_UNDER_TEST } from '../src/adapters/interface.js';
import { runAdapterMatrix, runFidelityHarness, runFullSurface } from '../src/flows/fidelity.js';

describe('dogfood-sqlite-wal-fts-app — fidelity harness', () => {
  it('T-DSF-001 mock adapter covers all 5 ops when driven end-to-end', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({ mock, real, run: runFullSurface });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/orm/sqlite-wal-fts-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 18, integration: 4, e2e: 3 },
      mutation: { mutations: 20, killed: 15 },
    });

    expect(output.report.fidelity.mockCoveredMethods).toBe(OPS_UNDER_TEST.length);
    expect(output.report.fidelity.realTotalMethods).toBe(OPS_UNDER_TEST.length);
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });

  it('T-DSF-002 divergences drop to 0 when real trace matches mock trace', async () => {
    const mock = makeMockAdapter();
    // Simulate a "matching" real by driving a second mock as if it were
    // the real adapter — this proves the fidelity harness collapses
    // divergences when the 2 traces agree per-op.
    const shadow = makeMockAdapter();
    const matrix = await runAdapterMatrix({ mock, real: shadow, run: runFullSurface });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/orm/sqlite-wal-fts-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 18, integration: 4, e2e: 3 },
      mutation: { mutations: 20, killed: 15 },
    });

    expect(output.divergences.length).toBe(0);
    expect(output.report.fidelity.behavioralDivergences).toBe(0);
    await mock.reset();
    await shadow.reset();
  });

  it('T-DSF-003 real skipped adapter records divergences on higher-level ops', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({ mock, real, run: runFullSurface });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/orm/sqlite-wal-fts-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 18, integration: 4, e2e: 3 },
      mutation: { mutations: 20, killed: 15 },
    });

    // driveWalFullJourney + driveFts5FullJourney + driveEdgeRoundtrip +
    // driveTestcontainersProbe + emitFidelity — mock 5 ok=true / real 5
    // ok=false → 5 divergences.
    expect(output.divergences.length).toBeGreaterThanOrEqual(4);
    for (const div of output.divergences) {
      expect(div.errorKind).toBe('BEHAVIORAL_DIVERGENCE');
    }
    await mock.reset();
    await real.reset();
  });
});
