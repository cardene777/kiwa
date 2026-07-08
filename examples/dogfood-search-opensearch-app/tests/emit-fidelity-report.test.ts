/**
 * Fidelity report + release gate tests — drive both mock + real
 * adapters through the same fixtures, hand the traces to the fidelity
 * harness, and assert the emitted JSON + markdown + release-gate
 * verdict are consistent with the observed divergence count.
 *
 * The fidelity harness is the seam through which the v1.36-1
 * `@kiwa/search` v0.3 relevance + synonym-advanced +
 * index-management axes are validated against the real OpenSearch OSS
 * cluster surface. Any drift the harness detects surfaces here.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { driveFullMatrix } from '../src/flows/search-flows.js';
import {
  runAdapterMatrix,
  runFidelityHarness,
} from '../src/flows/fidelity.js';
import { OPENSEARCH_HARNESS_OPS } from '../src/adapters/interface.js';
import { OPS_UNDER_TEST } from '../src/flows/search-flows.js';

describe('dogfood-search-opensearch-app — fidelity report + release gate', () => {
  it('T-DFSOS-FR-001 mock + force-env real produce identical op sets', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: (adapter) => driveFullMatrix(adapter),
    });
    const mockOps = new Set(matrix.mockTraces.map((t) => t.op));
    const realOps = new Set(matrix.realTraces.map((t) => t.op));
    expect(mockOps).toEqual(realOps);
  });

  it('T-DFSOS-FR-002 mock vs env-missing real diverges on every non-fidelity op', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ env: {} });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: (adapter) => driveFullMatrix(adapter),
    });
    const harness = runFidelityHarness({
      provider: 'kiwa-search-v0.3',
      version: '1.36-4',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      opsUnderTest: OPS_UNDER_TEST,
      coverageSummary: {
        lines: { pct: 90 },
        branches: { pct: 85 },
        functions: { pct: 92 },
      },
      testCount: { behavior: 36, integration: 0, e2e: 8 },
      mutation: { mutations: 100, killed: 78 },
      surfaceCoverage: { mockCoveredMethods: 19, realTotalMethods: 19 },
    });
    // env-missing real diverges from mock on every op that mattered.
    expect(harness.divergences.length).toBeGreaterThan(0);
  });

  it('T-DFSOS-FR-003 mock + force-env real produce zero divergences under runFidelityHarness', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: (adapter) => driveFullMatrix(adapter),
    });
    const harness = runFidelityHarness({
      provider: 'kiwa-search-v0.3',
      version: '1.36-4',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      opsUnderTest: OPS_UNDER_TEST,
      coverageSummary: {
        lines: { pct: 90 },
        branches: { pct: 85 },
        functions: { pct: 92 },
      },
      testCount: { behavior: 36, integration: 0, e2e: 8 },
      mutation: { mutations: 100, killed: 78 },
      surfaceCoverage: { mockCoveredMethods: 19, realTotalMethods: 19 },
    });
    expect(harness.divergences).toEqual([]);
  });

  it('T-DFSOS-FR-004 harness report includes a fidelity axis + verdict', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: (adapter) => driveFullMatrix(adapter),
    });
    const harness = runFidelityHarness({
      provider: 'kiwa-search-v0.3',
      version: '1.36-4',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      opsUnderTest: OPS_UNDER_TEST,
      coverageSummary: {
        lines: { pct: 95 },
        branches: { pct: 90 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 36, integration: 0, e2e: 8 },
      mutation: { mutations: 100, killed: 85 },
      surfaceCoverage: { mockCoveredMethods: 19, realTotalMethods: 19 },
    });
    expect(harness.report).toBeDefined();
    expect(harness.verdict).toBeDefined();
    expect(typeof harness.markdown).toBe('string');
    expect(typeof harness.json).toBe('string');
  });

  it('T-DFSOS-FR-005 OPENSEARCH_HARNESS_OPS has 21 entries', () => {
    // 17 axis ops + emitFidelitySignal + queryOpensearchHealth + reset
    // + resetVerified = 21.
    expect(OPENSEARCH_HARNESS_OPS.length).toBe(21);
  });

  it('T-DFSOS-FR-006 OPS_UNDER_TEST contains every OPENSEARCH_HARNESS_OP except reset + resetVerified', () => {
    const opsSet = new Set(OPS_UNDER_TEST);
    for (const op of OPENSEARCH_HARNESS_OPS) {
      if (op === 'reset' || op === 'resetVerified') continue;
      expect(opsSet.has(op)).toBe(true);
    }
    expect(OPS_UNDER_TEST.length).toBe(OPENSEARCH_HARNESS_OPS.length - 2);
  });

  it('T-DFSOS-FR-007 harness renders divergent-op notes when divergences present', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ env: {} });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: (adapter) => driveFullMatrix(adapter),
    });
    const harness = runFidelityHarness({
      provider: 'kiwa-search-v0.3',
      version: '1.36-4',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      opsUnderTest: OPS_UNDER_TEST,
      coverageSummary: {
        lines: { pct: 90 },
        branches: { pct: 85 },
        functions: { pct: 92 },
      },
      testCount: { behavior: 36, integration: 0, e2e: 8 },
      mutation: { mutations: 100, killed: 78 },
      surfaceCoverage: { mockCoveredMethods: 19, realTotalMethods: 19 },
    });
    expect(harness.report.notes).toContain('Divergent ops');
  });

  it('T-DFSOS-FR-008 harness renders no-divergence notes when clean', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: (adapter) => driveFullMatrix(adapter),
    });
    const harness = runFidelityHarness({
      provider: 'kiwa-search-v0.3',
      version: '1.36-4',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      opsUnderTest: OPS_UNDER_TEST,
      coverageSummary: {
        lines: { pct: 95 },
        branches: { pct: 90 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 36, integration: 0, e2e: 8 },
      mutation: { mutations: 100, killed: 85 },
      surfaceCoverage: { mockCoveredMethods: 19, realTotalMethods: 19 },
    });
    expect(harness.report.notes).toContain('No behavioral divergences');
  });
});
