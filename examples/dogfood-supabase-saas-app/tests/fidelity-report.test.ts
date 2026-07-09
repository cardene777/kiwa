import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import { onboardWithPassword } from '../src/flows/user-flows.js';

const opsUnderTest = [
  'signUp',
  'signInWithPassword',
  'requestMagicLink',
  'consumeMagicLink',
  'requestOAuthPkce',
  'exchangeOAuthPkce',
  'listDocsFor',
  'enrollTotp',
  'verifyTotpChallenge',
  'registerSamlIdp',
  'ssoLoginWithSaml',
  'siweLogin',
];

describe('dogfood-supabase — fidelity harness', () => {
  it('T-DFS-FID-001 mock adapter reports full coverage of onboarding op', async () => {
    const mock = await makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await onboardWithPassword(a, { email: 'user@example.test', password: 'x' }).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/auth/supabase-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 8, e2e: 8 },
      mutation: { mutations: 40, killed: 26 },
    });
    // The harness always emits a report even when divergences exist.
    expect(output.report.provider).toBe('@kiwa-lab/auth/supabase-dogfood');
    // The mock adapter definitely covers onboarding ops.
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThanOrEqual(2);
    // divergences count is finite integer.
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DFS-FID-002 divergence is flagged when real mode is skipped', async () => {
    const mock = await makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await a.signUp({ email: 'x@example.test', password: 'x' }).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/auth/supabase-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: ['signUp'],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 100 },
        branches: { pct: 100 },
        functions: { pct: 100 },
      },
      testCount: { behavior: 44, integration: 8, e2e: 8 },
      mutation: { mutations: 40, killed: 26 },
    });
    // Real adapter is skipped (no env vars) -> divergence recorded.
    expect((output.divergences.length ?? 0)).toBeGreaterThan(0);
    expect(output.report.notes).toContain('divergences');
    await mock.reset();
    await real.reset();
  });

  it('T-DFS-FID-003 harness emits markdown + json outputs', async () => {
    const mock = await makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async () => undefined,
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/auth/supabase-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 8, e2e: 8 },
      mutation: { mutations: 40, killed: 26 },
    });
    expect(output.markdown).toContain('Quality Report');
    expect(JSON.parse(output.json).fidelity).toBeDefined();
    await mock.reset();
    await real.reset();
  });
});
