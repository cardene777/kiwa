import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  a11yAllForms,
  mountAllForms,
  submitAllForms,
  validateAllForms,
} from '../src/flows/form-flows.js';

const opsUnderTest = [
  'mount',
  'interactValidation',
  'interactSubmit',
  'checkA11y',
];

describe('dogfood-form-ct — fidelity harness contract (7-axis release gate)', () => {
  it('T-DFFC-FID-001 fidelity harness runs mock + skipped real, produces divergences + report', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await mountAllForms(adapter);
          await validateAllForms(adapter);
          await submitAllForms(adapter);
          await a11yAllForms(adapter);
        } catch {
          // Real-mode failures are recorded in the trace.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/component/form-ct',
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
      testCount: { behavior: 45, integration: 5, e2e: 5 },
      mutation: { mutations: 30, killed: 22 },
      surfaceCoverage: { mockCoveredMethods: 4, realTotalMethods: 4 },
    });

    // 7-axis provider (component prefix, not AI-LLM).
    expect(output.verdict.axesEvaluated).toBe(7);
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThan(0);
    expect(output.markdown).toContain('Quality Report');
    expect(output.json).toContain('"provider"');
    await mock.reset();
    await real.reset();
  });

  it('T-DFFC-FID-002 divergences include every op the real adapter skipped', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await mountAllForms(adapter);
          await submitAllForms(adapter);
        } catch {
          // Skip failures recorded in trace.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/component/form-ct',
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
      testCount: { behavior: 45, integration: 5, e2e: 5 },
      mutation: { mutations: 30, killed: 22 },
      surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 4 },
    });
    // The ops the flow exercised in mock mode should appear as divergences
    // (mockOk=true / realOk=false) because the real adapter reports
    // PW_CT_REAL_ENV_MISSING for every op.
    const divergentOps = new Set(output.divergences.map((d) => d.op));
    expect(divergentOps.has('mount')).toBe(true);
    expect(divergentOps.has('interactSubmit')).toBe(true);
    await mock.reset();
    await real.reset();
  });

  it('T-DFFC-FID-003 mockLatencySamplesMs are non-empty and non-negative', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await mountAllForms(adapter);
          await a11yAllForms(adapter);
        } catch {
          // Real-mode failures are recorded in the trace.
        }
      },
    });
    expect(matrix.mockLatencySamplesMs.length).toBeGreaterThan(0);
    for (const sample of matrix.mockLatencySamplesMs) {
      expect(sample).toBeGreaterThanOrEqual(0);
    }
    await mock.reset();
    await real.reset();
  });

  it('T-DFFC-FID-004 mock adapter failures propagate through runAdapterMatrix', async () => {
    // A mock adapter that always throws must fail the matrix — the release
    // gate cannot silently pass on a partial trace. Real-mode failures are
    // still swallowed (skipped adapter is normal), but mock failures are not.
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    await expect(
      runAdapterMatrix({
        mock,
        real,
        run: async (adapter) => {
          if (adapter.mode === 'mock') {
            throw new Error('injected mock failure');
          }
        },
      }),
    ).rejects.toThrow(/injected mock failure/);
    await mock.reset();
    await real.reset();
  });
});
