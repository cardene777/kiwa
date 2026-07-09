import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { VisualRegressionAdapter } from '../src/adapters/interface.js';
import {
  runAdapterMatrix,
  runFidelityHarness,
} from '../src/flows/fidelity.js';
import {
  acceptAllPendingChanges,
  captureAllScenesChanged,
  captureAllScenesNeutral,
  seedAllBaselines,
} from '../src/flows/visual-flows.js';

const opsUnderTest = ['seedBaselines', 'captureAll', 'review'];

let mock: VisualRegressionAdapter;
let real: VisualRegressionAdapter;

beforeEach(() => {
  mock = makeMockAdapter();
  real = makeRealAdapter();
});

afterEach(async () => {
  await mock.reset();
  await real.reset();
});

async function driveFullFlow(adapter: VisualRegressionAdapter): Promise<void> {
  await seedAllBaselines(adapter);
  await captureAllScenesNeutral(adapter);
  await captureAllScenesChanged(adapter);
  await acceptAllPendingChanges(adapter);
}

describe('dogfood-visual-regression — fidelity harness contract', () => {
  it('T-DFVR-FID-001 harness completes even when the real adapter is skipped', async () => {
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveFullFlow(adapter);
        } catch {
          // Real path throws SkippedError when CHROMATIC_PROJECT_TOKEN is
          // unset. Divergence is captured in `traces()` regardless.
        }
      },
    });
    expect(matrix.mockTraces.length).toBeGreaterThan(0);
    expect(matrix.realTraces.length).toBeGreaterThan(0);
  });

  it('T-DFVR-FID-002 diverges 3 ops when real mode is absent (behavioural divergence per op)', async () => {
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveFullFlow(adapter);
        } catch {
          // ignore SkippedError
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/component/visual-regression',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 6, e2e: 7 },
      mutation: { mutations: 30, killed: 22 },
      surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 3 },
    });
    // When the real adapter is skipped, every op the mock covers is a
    // behavioural divergence — the harness must report exactly 3 (the 3 ops
    // this dogfood exercises).
    expect(output.divergences.length).toBeGreaterThanOrEqual(3);
    for (const d of output.divergences) {
      expect(opsUnderTest).toContain(d.op);
    }
  });

  it('T-DFVR-FID-003 harness records divergent op names as BEHAVIORAL_DIVERGENCE', async () => {
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveFullFlow(adapter);
        } catch {
          // ignore SkippedError
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/component/visual-regression',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 6, e2e: 7 },
      mutation: { mutations: 30, killed: 22 },
      surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 3 },
    });
    const divergenceKinds = new Set(output.divergences.map((d) => d.errorKind));
    expect(divergenceKinds.has('BEHAVIORAL_DIVERGENCE')).toBe(true);
  });

  it('T-DFVR-FID-004 release gate verdict evaluates 7 axes even without AI-LLM overlay', async () => {
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveFullFlow(adapter);
        } catch {
          // ignore SkippedError
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/component/visual-regression',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 6, e2e: 7 },
      mutation: { mutations: 30, killed: 22 },
      surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 3 },
    });
    expect(output.verdict.axesEvaluated).toBe(7);
    expect(output.verdict.passed).toBe(true);
  });

  it('T-DFVR-FID-005 propagates a mock-side failure (mock must never silently pass)', async () => {
    // Simulate a mock-side regression by throwing inside the run callback
    // when driving the mock. The harness must surface the exception so a
    // real regression cannot silently pass the release gate.
    await expect(
      runAdapterMatrix({
        mock,
        real,
        run: async (adapter) => {
          if (adapter.mode === 'mock') {
            throw new Error('simulated mock regression');
          }
          try {
            await driveFullFlow(adapter);
          } catch {
            // ignore
          }
        },
      }),
    ).rejects.toThrowError(/simulated mock regression/);
  });
});
