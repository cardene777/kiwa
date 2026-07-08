import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MUTATION_TIER_THRESHOLDS,
  assertMutationTier,
  evaluateReleaseGate,
  mutationFromCounts,
  resolveMutationTier,
  type MutationTier,
  type QualityReport,
} from '../src/index.js';

/**
 * v1.27-4 — 12-axis release gate coverage.
 *
 * The 12th axis is a **tier-aware** mutation kill-rate check. Baseline JSON
 * under `.mutation-baseline/<pkg>.json` records the tier verbally as
 * `Core` / `Framework` / `SaaS` / `Test type` (matching
 * `docs/quality/mutation-thresholds.md`). The runtime helpers normalise
 * those spellings to the machine-friendly `core` / `framework` / `saas` /
 * `test-type` enum so the gate can consume them without a lookup table
 * per call site.
 *
 * Thresholds are the `high` column from the SSOT tier table (Core 80 /
 * Framework 70 / SaaS 65 / Test type 60). Per-package looser overrides land
 * in `scripts/check-mutation-gates.mjs` (not here) so the gate library keeps
 * the tier default as the runtime bar.
 */

function baseReport(): QualityReport {
  return {
    provider: '@kiwa/example',
    version: '0.1.0',
    reportedAt: '2026-07-05T00:00:00Z',
    coverage: { line: 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 32, survived: 8, killRate: 80 },
  };
}

describe('DEFAULT_MUTATION_TIER_THRESHOLDS SSOT', () => {
  it('T-QM-MT-001 exposes the 4-tier threshold table SSOT', () => {
    expect(DEFAULT_MUTATION_TIER_THRESHOLDS).toEqual({
      core: 80,
      framework: 70,
      saas: 65,
      'test-type': 60,
    });
  });
});

describe('resolveMutationTier — baseline label normalisation', () => {
  it('T-QM-MT-002 maps baseline JSON tier strings to the enum', () => {
    // baseline JSON writes the verbal tier used in docs/quality/mutation-thresholds.md.
    expect(resolveMutationTier('Core')).toBe('core');
    expect(resolveMutationTier('Framework')).toBe('framework');
    expect(resolveMutationTier('SaaS')).toBe('saas');
    expect(resolveMutationTier('Test type')).toBe('test-type');
  });

  it('T-QM-MT-003 accepts the enum spellings unchanged', () => {
    expect(resolveMutationTier('core')).toBe('core');
    expect(resolveMutationTier('framework')).toBe('framework');
    expect(resolveMutationTier('saas')).toBe('saas');
    expect(resolveMutationTier('test-type')).toBe('test-type');
  });

  it('T-QM-MT-004 is case-insensitive and trims whitespace', () => {
    expect(resolveMutationTier(' CORE ')).toBe('core');
    expect(resolveMutationTier('framework ')).toBe('framework');
    expect(resolveMutationTier('Saas')).toBe('saas');
    expect(resolveMutationTier('TEST TYPE')).toBe('test-type');
  });

  it('T-QM-MT-005 rejects unknown tier labels', () => {
    expect(() => resolveMutationTier('unknown')).toThrow(/unknown mutation tier/i);
    expect(() => resolveMutationTier('')).toThrow(/unknown mutation tier/i);
  });
});

describe('assertMutationTier — 4-tier threshold enforcement helper', () => {
  it('T-QM-MT-006 passes when kill rate meets tier default threshold', () => {
    const metric = mutationFromCounts({ mutations: 100, killed: 80 });
    expect(() =>
      assertMutationTier({ metric, tier: 'core' }),
    ).not.toThrow();
  });

  it('T-QM-MT-007 fails when kill rate below tier default threshold', () => {
    const metric = mutationFromCounts({ mutations: 100, killed: 70 });
    expect(() =>
      assertMutationTier({ metric, tier: 'core' }),
    ).toThrow(/core.*80/);
  });

  it('T-QM-MT-008 accepts a looser per-package override that stays above tier break', () => {
    // Framework tier default is 70. The auth adapter has an override at 65
    // (see .mutation-baseline/auth.json). Passing an explicit threshold lets
    // callers re-use the same helper for override paths.
    const metric = mutationFromCounts({ mutations: 100, killed: 65 });
    expect(() =>
      assertMutationTier({ metric, tier: 'framework', threshold: 65 }),
    ).not.toThrow();
  });

  it('T-QM-MT-009 override still fails when kill rate below the override floor', () => {
    const metric = mutationFromCounts({ mutations: 100, killed: 55 });
    expect(() =>
      assertMutationTier({ metric, tier: 'framework', threshold: 65 }),
    ).toThrow(/framework.*65/);
  });

  it('T-QM-MT-010 error message surfaces actual + threshold + tier for actionable debugging', () => {
    const metric = mutationFromCounts({ mutations: 200, killed: 100 });
    expect(() => assertMutationTier({ metric, tier: 'saas' }))
      .toThrow(/mutation kill rate.*50\.00.*saas.*65/i);
  });

  it('T-QM-MT-011 accepts the "Test type" verbal label via resolveMutationTier', () => {
    const metric = mutationFromCounts({ mutations: 100, killed: 60 });
    expect(() =>
      assertMutationTier({ metric, tier: resolveMutationTier('Test type') }),
    ).not.toThrow();
  });

  it('T-QM-MT-012 zero-mutation metric fails as "no signal" not "0% pass"', () => {
    // A package with 0 mutations should not silently pass — an empty test
    // suite would otherwise register as 0/0 = 0 kill rate and slip past.
    const metric = mutationFromCounts({ mutations: 0, killed: 0 });
    expect(() =>
      assertMutationTier({ metric, tier: 'core' }),
    ).toThrow(/no mutation signal/i);
  });
});

describe('evaluateReleaseGate — 12-axis mode via mutationTier', () => {
  it('T-QM-MT-013 non-tier caller keeps 7-axis / 11-axis behaviour unchanged', () => {
    // No tier passed → legacy per-provider mutationKillRate ceiling from the
    // 11-axis SSOT is used (backward compat).
    const verdict = evaluateReleaseGate(baseReport());
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(7);
  });

  it('T-QM-MT-014 tier caller adds a 12th axis with tier-aware threshold', () => {
    const report = baseReport();
    const verdict = evaluateReleaseGate(report, {}, { mutationTier: 'core' });
    // Core tier requires 80 %; kill rate 80 passes exactly at the floor.
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(8);
  });

  it('T-QM-MT-015 tier caller blocks when kill rate below tier default', () => {
    const report = baseReport();
    report.mutation = mutationFromCounts({ mutations: 100, killed: 70 });
    const verdict = evaluateReleaseGate(report, {}, { mutationTier: 'core' });
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'mutation.tier');
    expect(blocker?.op).toBe('>=');
    expect(blocker?.threshold).toBe(80);
    expect(blocker?.actual).toBe(70);
  });

  it('T-QM-MT-016 tier caller uses looser per-package override when supplied', () => {
    const report = baseReport();
    report.mutation = mutationFromCounts({ mutations: 100, killed: 66 });
    const verdict = evaluateReleaseGate(report, {}, {
      mutationTier: 'framework',
      mutationTierThreshold: 65,
    });
    expect(verdict.passed).toBe(true);
    const blocker = verdict.blockers.find((b) => b.axis === 'mutation.tier');
    expect(blocker).toBeUndefined();
  });

  it('T-QM-MT-017 tier + AI-LLM together evaluates 12 axes (11 + tier)', () => {
    const report: QualityReport = {
      ...baseReport(),
      provider: '@kiwa/ai-llm',
      cost: { perRequestUsd: 0.05, totalUsd: 5, requests: 100 },
      latency: { p50Ms: 500, p95Ms: 1500, p99Ms: 2500, samples: 100 },
      token: { promptTokens: 800, completionTokens: 400, totalTokens: 1200, requests: 100 },
      accuracy: { score: 0.92, samples: 50, method: 'cosine' },
    };
    report.mutation = mutationFromCounts({ mutations: 100, killed: 66 });
    const verdict = evaluateReleaseGate(report, {}, { mutationTier: 'saas' });
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(12);
  });

  it('T-QM-MT-018 verbal tier label is accepted via resolveMutationTier', () => {
    const report = baseReport();
    report.mutation = mutationFromCounts({ mutations: 100, killed: 60 });
    const verdict = evaluateReleaseGate(report, {}, {
      mutationTier: resolveMutationTier('Test type'),
    });
    expect(verdict.passed).toBe(true);
  });

  it('T-QM-MT-019 tier axis surfaces alongside the legacy mutation axis, not replacing it', () => {
    // Legacy per-provider mutationKillRate stays in play so v1.11 consumers
    // that pass overrides still see the old blocker shape. When a tier is
    // added it is an **additional** 12th axis, not a replacement.
    const report = baseReport();
    report.mutation = mutationFromCounts({ mutations: 100, killed: 50 });
    const verdict = evaluateReleaseGate(
      report,
      { mutationKillRate: 55 },
      { mutationTier: 'core' },
    );
    const axes = verdict.blockers.map((b) => b.axis);
    expect(axes).toContain('mutation.killRate'); // 50 < 55 legacy ceiling
    expect(axes).toContain('mutation.tier'); // 50 < 80 tier ceiling
  });

  it('T-QM-MT-020 type-level enum shape is stable SSOT', () => {
    // Static type sanity — the enum values are exactly the four tier keys.
    const tiers: MutationTier[] = ['core', 'framework', 'saas', 'test-type'];
    for (const t of tiers) {
      expect(DEFAULT_MUTATION_TIER_THRESHOLDS[t]).toBeGreaterThan(0);
    }
  });
});
