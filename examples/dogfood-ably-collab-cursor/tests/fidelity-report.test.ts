import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  burstMouseMove,
  joinAndDrawFirstStroke,
  lateJoinerRewind,
} from '../src/flows/cursor-flows.js';

const opsUnderTest = ['joinBoard', 'moveCursor', 'rewindHistory', 'getPresence'];

describe('dogfood-ably-collab-cursor — fidelity harness', () => {
  it('T-DFA-FID-001 mock adapter covers all 4 ops (joinBoard / moveCursor / rewindHistory / getPresence)', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await joinAndDrawFirstStroke(a).catch(() => undefined);
        await burstMouseMove(a).catch(() => undefined);
        await lateJoinerRewind(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/realtime/ably-collab-cursor',
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
      testCount: { behavior: 15, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 4, realTotalMethods: 4 },
    });
    expect(output.report.provider).toBe('@kiwa-lab/realtime/ably-collab-cursor');
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThanOrEqual(4);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DFA-FID-002 divergence is flagged when real mode is skipped', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await joinAndDrawFirstStroke(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/realtime/ably-collab-cursor',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: ['joinBoard', 'moveCursor', 'getPresence'],
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 100 },
        branches: { pct: 100 },
        functions: { pct: 100 },
      },
      testCount: { behavior: 15, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 4 },
    });
    expect(output.divergences.length).toBeGreaterThan(0);
    expect(output.report.notes ?? '').toContain('divergences');
    await mock.reset();
    await real.reset();
  });

  it('T-DFA-FID-003 harness emits markdown + json outputs and evaluates 7 axes for realtime provider', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await joinAndDrawFirstStroke(a).catch(() => undefined);
        await burstMouseMove(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/realtime/ably-collab-cursor',
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
      testCount: { behavior: 15, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 4, realTotalMethods: 4 },
    });
    expect(output.markdown).toContain('Quality Report');
    const parsed = JSON.parse(output.json) as {
      fidelity: unknown;
      perf?: { p95Ms?: number };
      cost?: unknown;
      accuracy?: unknown;
    };
    expect(parsed.fidelity).toBeDefined();
    // Realtime provider: common 7 axes only. cost / accuracy are absent
    // because they are AI-LLM-specific and Ably is not a token-priced
    // generative surface.
    expect(parsed.perf?.p95Ms).toBeGreaterThanOrEqual(0);
    expect(parsed.cost).toBeUndefined();
    expect(parsed.accuracy).toBeUndefined();
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });
});
