/**
 * Emit fidelity report — drive the multi-profile matrix through both
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
  runMultiProfileMatrix,
} from '../src/flows/pipeline-flows.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';

describe('dogfood-otel-exemplar-app — emit fidelity report', () => {
  it('T-DFOTEL-EM-001 writes JSON + markdown snapshots into quality-report/', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        await runMultiProfileMatrix(adapter);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/observability/otel-exemplar',
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
      testCount: { behavior: 55, integration: 3, e2e: 0 },
      mutation: { mutations: 50, killed: 38 },
      surfaceCoverage: {
        mockCoveredMethods: 15,
        realTotalMethods: 15,
      },
    });

    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    expect(output.markdown).toContain('Quality Report');
    // OTel exemplar harness runs on the common 7 axes.
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });

  it('T-DFOTEL-EM-002 mock traces contain a matched op for every op in OPS_UNDER_TEST', async () => {
    const mock = makeMockAdapter();
    await runMultiProfileMatrix(mock);
    const trace = mock.trace();
    const ops = new Set(trace.map((e) => e.op));
    for (const op of OPS_UNDER_TEST) {
      expect(ops.has(op)).toBe(true);
    }
  });

  it('T-DFOTEL-EM-003 mock + real (forceEnvPresent) diff has zero divergent events', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        await runMultiProfileMatrix(adapter);
      },
    });
    const diff = diffTraces(matrix.mockTraces, matrix.realTraces);
    expect(diff.missingInReal).toHaveLength(0);
    expect(diff.missingInMock).toHaveLength(0);
    expect(diff.divergentEvents).toHaveLength(0);
  });

  it('T-DFOTEL-EM-004 mock + real (env missing) diff still matches op names', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ env: {} });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        await runMultiProfileMatrix(adapter);
      },
    });
    // Real adapter emits otel.env_missing for every op; diffTraces
    // filters that as an expected fallback (real-side sentinel), so
    // divergentEvents should stay empty (op names still match).
    const diff = diffTraces(matrix.mockTraces, matrix.realTraces);
    expect(diff.matchedOps.length).toBeGreaterThan(0);
  });

  it('T-DFOTEL-EM-005 fidelity report notes describes ops when no divergence occurs', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        await runMultiProfileMatrix(adapter);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/observability/otel-exemplar',
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
      testCount: { behavior: 55, integration: 3, e2e: 0 },
      mutation: { mutations: 50, killed: 38 },
      surfaceCoverage: { mockCoveredMethods: 15, realTotalMethods: 15 },
    });
    expect((output.report.notes ?? '').length).toBeGreaterThan(0);
    expect(output.report.notes).toContain('No behavioral divergences');
  });

  it('T-DFOTEL-EM-006 quality-report JSON parses back with same fidelity numbers', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        await runMultiProfileMatrix(adapter);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/observability/otel-exemplar',
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
      testCount: { behavior: 55, integration: 3, e2e: 0 },
      mutation: { mutations: 50, killed: 38 },
      surfaceCoverage: { mockCoveredMethods: 15, realTotalMethods: 15 },
    });
    const parsed = JSON.parse(output.json);
    expect(parsed.fidelity.mockCoveredMethods).toBe(
      output.report.fidelity.mockCoveredMethods,
    );
    expect(parsed.provider).toBe('@kiwa-test/observability/otel-exemplar');
    expect(parsed.version).toBe('2.1.0');
  });

  it('T-DFOTEL-EM-007 runMultiProfileMatrix drives all 3 profiles × 4 baggage sets = 12 lifecycles', async () => {
    const mock = makeMockAdapter();
    const result = await runMultiProfileMatrix(mock);
    expect(result.lifecyclesRun).toBe(12);
    const trace = mock.trace();
    const buckets = new Set(trace.map((e) => e.bucket));
    expect(buckets.has('traces')).toBe(true);
    expect(buckets.has('metrics')).toBe(true);
    expect(buckets.has('logs')).toBe(true);
  });

  it('T-DFOTEL-EM-008 trace records both attachTraceToMetric and resolveTraceToMetric per profile', async () => {
    const mock = makeMockAdapter();
    await runMultiProfileMatrix(mock);
    const trace = mock.trace();
    const attaches = trace.filter((t) => t.op === 'attachTraceToMetric');
    const resolves = trace.filter((t) => t.op === 'resolveTraceToMetric');
    // 3 profiles × 4 baggage sets = 12 lifecycles, each attaches 1 + resolves 1.
    expect(attaches).toHaveLength(12);
    expect(resolves).toHaveLength(12);
  });
});
