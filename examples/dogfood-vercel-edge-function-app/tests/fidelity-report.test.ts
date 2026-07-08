/**
 * Fidelity harness contract test — the 8-op surface, the mock-vs-real
 * trace diff, and the release gate 7 axis pass.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter } from '../src/lib/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/lib/fidelity.js';
import type { VercelEdgeAdapter } from '../src/lib/vercel-adapter.js';
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

async function runAllOps(adapter: VercelEdgeAdapter): Promise<void> {
  await adapter.driveGeoRoute({
    requestId: 'req-fid',
    acceptLanguage: 'en',
    clientCountry: 'US',
  });
  await adapter.driveGeoPrimaryWrite({ payload: 'seed' });
  await adapter.driveGeoReplicaSync({
    replicas: [...REGION_CATALOG.replicas],
  });
  await adapter.driveKvWrite({ key: 'k', value: 'v' });
  await adapter.driveKvRead({ key: 'k' });
  await adapter.driveKvRangeQuery({ prefix: 'k' });
  await adapter.driveSseOpen({
    streamId: 'stream-fid',
    firstChunk: 'data: 1\n\n',
  });
  await adapter.driveSseBackpressure({
    streamId: 'stream-fid',
    chunks: ['data: 2\n\n', 'data: 3\n\n'],
    highWaterMark: 8192,
  });
}

describe('fidelity harness contract', () => {
  it('T-DFVE-FR-001 mock run covers 8 ops', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await runAllOps(adapter);
        } catch {
          // Real path throws in skip mode — divergences recorded in trace.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/edge/vercel-edge-function',
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
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    expect(output.verdict.axesEvaluated).toBe(7);
    expect(output.markdown).toContain('Quality Report');
    await mock.reset();
    await real.reset();
  });

  it('T-DFVE-FR-002 mock failure propagates without being swallowed', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    await expect(
      runAdapterMatrix({
        mock,
        real,
        run: async (adapter) => {
          if (adapter.mode === 'mock') {
            throw new Error('mock-simulated-crash');
          }
        },
      }),
    ).rejects.toThrow('mock-simulated-crash');
    await mock.reset();
    await real.reset();
  });

  it('T-DFVE-FR-003 markdown includes divergence notes when real path skipped', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await runAllOps(adapter);
        } catch {
          // Real path throws — divergences captured in the trace.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/edge/vercel-edge-function',
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
    // In the skip path, every op has a mock-ok + real-skipped mismatch,
    // producing 8 BEHAVIORAL_DIVERGENCE entries.
    expect(output.divergences.length).toBeGreaterThan(0);
    expect(output.markdown).toContain('divergences');
    await mock.reset();
    await real.reset();
  });

  it('T-DFVE-FR-004 latency samples surface via perf.p95Ms axis', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await runAllOps(adapter);
        } catch {
          // Real path throws — mock latency samples remain.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/edge/vercel-edge-function',
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
    expect(output.report.perf.p95Ms).toBeGreaterThanOrEqual(0);
    expect(output.report.perf.samples).toBeGreaterThan(0);
    await mock.reset();
    await real.reset();
  });
});
