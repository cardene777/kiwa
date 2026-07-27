import { expect, it } from 'vitest';
import { a11yFromBaseline, assertFidelity, evaluateReleaseGate, mutationFromCounts, resolveMutationTier } from '../src/index.js';

it('validates the Quickstart mutation and fidelity examples', async () => {
  expect(mutationFromCounts({ mutations: 100, killed: 80 })).toMatchObject({ survived: 20, killRate: 80 });
  expect(resolveMutationTier('core')).toBe('core');
  const result = await assertFidelity({ mockFn: async (id: string) => ({ id }), realFn: async (id: string) => ({ id }), cases: [{ name: 'existing user', args: ['user-1'] }] });
  expect(result).toMatchObject({ passed: 1, failed: 0, ratio: 100 });
});

it('validates Core mutation and a11y tier gating', () => {
  const report = {
    provider: '@kiwa-lab/example', version: '1.0.0', reportedAt: '2026-07-17T00:00:00Z',
    coverage: { line: 90, branch: 82, function: 95 }, testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 }, perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: mutationFromCounts({ mutations: 100, killed: 80 }), a11y: a11yFromBaseline({ totals: { critical: 0, serious: 0, moderate: 2 } }),
  };
  expect(evaluateReleaseGate(report, {}, { mutationTier: 'core', a11yTier: 'core' })).toMatchObject({ passed: true, blockers: [] });
  const missing = evaluateReleaseGate({ ...report, mutation: mutationFromCounts({ mutations: 0, killed: 0 }) }, {}, { mutationTier: 'core', a11yTier: 'core' });
  expect(missing.blockers.map((blocker) => blocker.axis)).toContain('mutation.tier');
});
