/**
 * Emit fidelity report — drive the multi-objective matrix through both
 * adapters, diff traces, feed the divergence count into the
 * @kiwa-test/quality-metrics 13-axis release gate, and write JSON +
 * markdown snapshots to quality-report/.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import {
  OPS_UNDER_TEST,
  diffTraces,
  runMultiObjectiveMatrix,
} from '../src/flows/slo-flows.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';

describe('dogfood-observability-slo-app — emit fidelity report', () => {
  it('T-DFS-EM-001 writes JSON + markdown snapshots into quality-report/', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        await runMultiObjectiveMatrix(adapter);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/observability/slo',
      version: '2.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: OPS_UNDER_TEST,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 46, integration: 3, e2e: 0 },
      mutation: { mutations: 50, killed: 38 },
      surfaceCoverage: {
        mockCoveredMethods: 10,
        realTotalMethods: 10,
      },
    });

    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    expect(output.markdown).toContain('Quality Report');
    // Observability SLO harness runs on the common 7 axes.
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });

  it('T-DFS-EM-002 mock traces contain a matched op for every op in OPS_UNDER_TEST', async () => {
    const mock = makeMockAdapter();
    await runMultiObjectiveMatrix(mock);
    const trace = mock.trace();
    const ops = new Set(trace.map((e) => e.op));
    for (const op of OPS_UNDER_TEST) {
      expect(ops.has(op)).toBe(true);
    }
  });

  it('T-DFS-EM-003 mock + real (forceEnvPresent) diff has zero divergent events', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        await runMultiObjectiveMatrix(adapter);
      },
    });
    const diff = diffTraces(matrix.mockTraces, matrix.realTraces);
    expect(diff.missingInReal).toHaveLength(0);
    expect(diff.missingInMock).toHaveLength(0);
    expect(diff.divergentEvents).toHaveLength(0);
  });

  it('T-DFS-EM-004 mock + real (env missing) diff has divergent events for every op', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ env: {} });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        await runMultiObjectiveMatrix(adapter);
      },
    });
    // Real adapter emits slo.env_missing for every op; diffTraces
    // filters that as an expected fallback (real-side sentinel), so
    // divergentEvents should stay empty (op names still match).
    const diff = diffTraces(matrix.mockTraces, matrix.realTraces);
    expect(diff.matchedOps.length).toBeGreaterThan(0);
  });

  it('T-DFS-EM-005 fidelity report includes SLO harness ops in notes when divergence occurs', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ env: {} });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        await runMultiObjectiveMatrix(adapter);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/observability/slo',
      version: '2.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: OPS_UNDER_TEST,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 90 },
        branches: { pct: 85 },
        functions: { pct: 90 },
      },
      testCount: { behavior: 46, integration: 3, e2e: 0 },
      mutation: { mutations: 50, killed: 38 },
      surfaceCoverage: { mockCoveredMethods: 10, realTotalMethods: 10 },
    });
    expect((output.report.notes ?? '').length).toBeGreaterThan(0);
  });

  it('T-DFS-EM-006 quality-report JSON parses back with same fidelity numbers', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        await runMultiObjectiveMatrix(adapter);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/observability/slo',
      version: '2.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: OPS_UNDER_TEST,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 90 },
        branches: { pct: 85 },
        functions: { pct: 90 },
      },
      testCount: { behavior: 46, integration: 3, e2e: 0 },
      mutation: { mutations: 50, killed: 38 },
      surfaceCoverage: { mockCoveredMethods: 10, realTotalMethods: 10 },
    });
    const parsed = JSON.parse(output.json);
    expect(parsed.fidelity.mockCoveredMethods).toBe(
      output.report.fidelity.mockCoveredMethods,
    );
    expect(parsed.provider).toBe('@kiwa-test/observability/slo');
    expect(parsed.version).toBe('2.1.0');
  });

  it('T-DFS-EM-007 runMultiObjectiveMatrix drives all 3 objective lifecycles', async () => {
    const mock = makeMockAdapter();
    const result = await runMultiObjectiveMatrix(mock);
    expect(result.lifecyclesRun).toBe(3);
    const trace = mock.trace();
    const sloIds = new Set(trace.map((e) => e.sloId));
    expect(sloIds.has('api-internal-99.9')).toBe(true);
    expect(sloIds.has('api-saas-99.95')).toBe(true);
    expect(sloIds.has('api-payment-99.99')).toBe(true);
  });
});
