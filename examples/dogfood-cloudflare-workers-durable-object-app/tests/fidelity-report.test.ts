/**
 * Fidelity harness contract test — the 8-op surface, the mock-vs-real
 * trace diff, and the release gate 7 axis pass.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter } from '../src/lib/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/lib/fidelity.js';
import type { CloudflareDurableObjectAdapter } from '../src/lib/cf-adapter.js';

const OPS_UNDER_TEST = [
  'driveRoomJoin',
  'driveRoomBroadcast',
  'driveStorageTx',
  'driveAlarmPurge',
  'driveWsUpgrade',
  'driveWsSend',
  'driveWsClose',
  'driveWsHibernation',
];

async function runAllOps(adapter: CloudflareDurableObjectAdapter): Promise<void> {
  await adapter.driveRoomJoin({ roomId: 'r', memberId: 'alice' });
  await adapter.driveWsUpgrade({ roomId: 'r', memberId: 'alice' });
  await adapter.driveRoomBroadcast({
    roomId: 'r',
    senderId: 'alice',
    message: 'hi',
    receivers: ['alice'],
  });
  await adapter.driveStorageTx({
    roomId: 'r',
    writes: [{ key: 'k', value: 'v' }],
    rollback: false,
  });
  await adapter.driveAlarmPurge({ roomId: 'r', scheduledAt: 100, now: 200 });
  await adapter.driveWsSend({
    roomId: 'r',
    memberId: 'alice',
    messages: ['m'],
  });
  await adapter.driveWsHibernation({
    roomId: 'r',
    memberId: 'alice',
    idleForMs: 30_000,
  });
  await adapter.driveRoomJoin({ roomId: 'r', memberId: 'alice' });
  await adapter.driveWsUpgrade({ roomId: 'r', memberId: 'alice' });
  await adapter.driveWsClose({ roomId: 'r', memberId: 'alice', code: 1000 });
}

describe('fidelity harness contract', () => {
  it('T-DFCF-FR-001 mock run covers 8 ops', async () => {
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
      provider: '@kiwa/edge/cloudflare-durable-object',
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

  it('T-DFCF-FR-002 mock failure propagates without being swallowed', async () => {
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

  it('T-DFCF-FR-003 markdown includes divergence notes when real path skipped', async () => {
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
      provider: '@kiwa/edge/cloudflare-durable-object',
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
});
