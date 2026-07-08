import { describe, expect, it } from 'vitest';
import {
  DEFAULT_A11Y_TIER_THRESHOLDS,
  a11yFromBaseline,
  assertA11yTier,
  evaluateReleaseGate,
  mutationFromCounts,
  resolveA11yTier,
  type A11yTier,
  type QualityReport,
} from '../src/index.js';

/**
 * v1.30-4 — 13-axis release gate coverage.
 *
 * The 13th axis is a **tier-aware** a11y violation count check. Baseline JSON
 * under `.a11y-baseline/{pkg}.json` records the tier verbally as
 * `Core` / `Framework` / `SaaS` / `Test type` (matching
 * `docs/quality/a11y-thresholds.md`). The runtime helpers normalise those
 * spellings to the machine-friendly `core` / `framework` / `saas` /
 * `test-type` enum so the gate can consume them without a lookup table per
 * call site.
 *
 * Thresholds are the `critical / serious / moderate` ceilings from the SSOT
 * tier table (Core 0/0/3, Framework 0/3/10, SaaS 0/0/0, Test type 0/3/10).
 * `critical` is always 0 (SSOT invariant, never overridable). `serious` /
 * `moderate` accept per-package overrides that must not raise `critical`.
 *
 * Mirrors the mutation-tier interface (v1.27-4, gate-mutation-tier.test.ts)
 * so downstream release-gate consumers get one unified 4-tier pattern for
 * both mutation and a11y.
 */

function baseReport(): QualityReport {
  return {
    provider: '@kiwa/example',
    version: '0.1.0',
    reportedAt: '2026-07-06T00:00:00Z',
    coverage: { line: 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 32, survived: 8, killRate: 80 },
  };
}

describe('DEFAULT_A11Y_TIER_THRESHOLDS SSOT', () => {
  it('T-QM-AT-001 exposes the 4-tier a11y threshold table SSOT', () => {
    expect(DEFAULT_A11Y_TIER_THRESHOLDS).toEqual({
      core: { critical: 0, serious: 0, moderate: 3 },
      framework: { critical: 0, serious: 3, moderate: 10 },
      saas: { critical: 0, serious: 0, moderate: 0 },
      'test-type': { critical: 0, serious: 3, moderate: 10 },
    });
  });

  it('T-QM-AT-002 critical bar is 0 across every tier (SSOT invariant)', () => {
    // docs/quality/a11y-thresholds.md § Overrides:
    // "No override may ever raise the critical bar."
    for (const tier of ['core', 'framework', 'saas', 'test-type'] as const) {
      expect(DEFAULT_A11Y_TIER_THRESHOLDS[tier].critical).toBe(0);
    }
  });
});

describe('resolveA11yTier — baseline label normalisation', () => {
  it('T-QM-AT-003 maps baseline JSON tier strings to the enum', () => {
    expect(resolveA11yTier('Core')).toBe('core');
    expect(resolveA11yTier('Framework')).toBe('framework');
    expect(resolveA11yTier('SaaS')).toBe('saas');
    expect(resolveA11yTier('Test type')).toBe('test-type');
  });

  it('T-QM-AT-004 accepts the enum spellings unchanged', () => {
    expect(resolveA11yTier('core')).toBe('core');
    expect(resolveA11yTier('framework')).toBe('framework');
    expect(resolveA11yTier('saas')).toBe('saas');
    expect(resolveA11yTier('test-type')).toBe('test-type');
  });

  it('T-QM-AT-005 is case-insensitive and trims whitespace', () => {
    expect(resolveA11yTier(' CORE ')).toBe('core');
    expect(resolveA11yTier('framework ')).toBe('framework');
    expect(resolveA11yTier('Saas')).toBe('saas');
    expect(resolveA11yTier('TEST TYPE')).toBe('test-type');
  });

  it('T-QM-AT-006 rejects unknown tier labels', () => {
    expect(() => resolveA11yTier('unknown')).toThrow(/unknown a11y tier/i);
    expect(() => resolveA11yTier('')).toThrow(/unknown a11y tier/i);
  });
});

describe('assertA11yTier — 4-tier threshold enforcement helper', () => {
  it('T-QM-AT-007 passes when every impact sits at or below tier default', () => {
    // Framework tier default: critical 0 / serious 3 / moderate 10.
    expect(() =>
      assertA11yTier({
        metric: { critical: 0, serious: 2, moderate: 8, minor: 4 },
        tier: 'framework',
      }),
    ).not.toThrow();
  });

  it('T-QM-AT-008 fails when critical > 0 in any tier (SSOT invariant)', () => {
    // SSOT: "critical > 0 fails the run in every tier."
    expect(() =>
      assertA11yTier({
        metric: { critical: 1, serious: 0, moderate: 0, minor: 0 },
        tier: 'framework',
      }),
    ).toThrow(/critical.*1.*>.*0/);
  });

  it('T-QM-AT-009 fails when serious > tier ceiling', () => {
    // Core tier: serious ceiling 0.
    expect(() =>
      assertA11yTier({
        metric: { critical: 0, serious: 1, moderate: 0, minor: 0 },
        tier: 'core',
      }),
    ).toThrow(/serious.*1.*>.*0/);
  });

  it('T-QM-AT-010 fails when moderate > tier ceiling', () => {
    // SaaS tier: moderate ceiling 0.
    expect(() =>
      assertA11yTier({
        metric: { critical: 0, serious: 0, moderate: 1, minor: 0 },
        tier: 'saas',
      }),
    ).toThrow(/moderate.*1.*>.*0/);
  });

  it('T-QM-AT-011 accepts a stricter per-package override (raise floor)', () => {
    // component overrides moderate to 0 while staying Test type tier.
    expect(() =>
      assertA11yTier({
        metric: { critical: 0, serious: 0, moderate: 0, minor: 0 },
        tier: 'test-type',
        threshold: { critical: 0, serious: 0, moderate: 0 },
      }),
    ).not.toThrow();
    expect(() =>
      assertA11yTier({
        metric: { critical: 0, serious: 0, moderate: 1, minor: 0 },
        tier: 'test-type',
        threshold: { critical: 0, serious: 0, moderate: 0 },
      }),
    ).toThrow(/moderate.*1.*>.*0/);
  });

  it('T-QM-AT-012 zero-violation metric passes (unlike mutation, empty is desired)', () => {
    // SSOT § 13-axis release gate integration: "Empty-violation metrics do not
    // throw (unlike mutation testing, an a11y run with zero violations is the
    // desired state)."
    expect(() =>
      assertA11yTier({
        metric: { critical: 0, serious: 0, moderate: 0, minor: 0 },
        tier: 'core',
      }),
    ).not.toThrow();
  });

  it('T-QM-AT-013 error message surfaces impact + actual + threshold + tier', () => {
    expect(() =>
      assertA11yTier({
        metric: { critical: 0, serious: 5, moderate: 0, minor: 0 },
        tier: 'framework',
      }),
    ).toThrow(/serious.*5.*>.*3.*framework/i);
  });

  it('T-QM-AT-014 accepts the "Test type" verbal label via resolveA11yTier', () => {
    // Test-type tier: serious 3 / moderate 10.
    expect(() =>
      assertA11yTier({
        metric: { critical: 0, serious: 3, moderate: 10, minor: 5 },
        tier: resolveA11yTier('Test type'),
      }),
    ).not.toThrow();
  });
});

describe('a11yFromBaseline — collector helper', () => {
  it('T-QM-AT-015 builds A11yMetric from a11y baseline totals block', () => {
    const metric = a11yFromBaseline({
      totals: { critical: 0, serious: 2, moderate: 5, minor: 4 },
    });
    expect(metric).toEqual({ critical: 0, serious: 2, moderate: 5, minor: 4 });
  });

  it('T-QM-AT-016 defaults missing impact counts to 0 (layers-absent baseline)', () => {
    const metric = a11yFromBaseline({ totals: { critical: 0 } });
    expect(metric).toEqual({ critical: 0, serious: 0, moderate: 0, minor: 0 });
  });
});

describe('evaluateReleaseGate — 13-axis mode via a11yTier', () => {
  it('T-QM-AT-017 non-tier caller keeps 7-axis / 11-axis / 12-axis behaviour unchanged', () => {
    // No a11yTier passed → verdict stays at legacy count for backward compat.
    const verdict = evaluateReleaseGate(baseReport());
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(7);
  });

  it('T-QM-AT-018 a11yTier caller adds a 13th axis with tier-aware threshold', () => {
    const report = {
      ...baseReport(),
      a11y: { critical: 0, serious: 0, moderate: 2, minor: 0 },
    };
    const verdict = evaluateReleaseGate(report, {}, { a11yTier: 'core' });
    // Core tier: critical 0 / serious 0 / moderate 3 — 2 sits inside.
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(8);
  });

  it('T-QM-AT-019 a11yTier caller blocks when a11y violation above tier ceiling', () => {
    const report = {
      ...baseReport(),
      a11y: { critical: 0, serious: 5, moderate: 0, minor: 0 },
    };
    const verdict = evaluateReleaseGate(report, {}, { a11yTier: 'framework' });
    // Framework tier: serious 3 ceiling — 5 exceeds.
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'a11y.tier');
    expect(blocker?.op).toBe('<=');
    expect(blocker?.threshold).toBe(3);
    expect(blocker?.actual).toBe(5);
  });

  it('T-QM-AT-020 a11yTier caller enforces critical > 0 in every tier', () => {
    const report = {
      ...baseReport(),
      a11y: { critical: 1, serious: 0, moderate: 0, minor: 0 },
    };
    const verdict = evaluateReleaseGate(report, {}, { a11yTier: 'framework' });
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'a11y.tier');
    expect(blocker).toBeDefined();
    expect(blocker?.threshold).toBe(0);
    expect(blocker?.actual).toBe(1);
  });

  it('T-QM-AT-021 mutationTier + a11yTier together evaluates 9 axes (7 + 2 tiers)', () => {
    const report = {
      ...baseReport(),
      a11y: { critical: 0, serious: 1, moderate: 5, minor: 0 },
    };
    report.mutation = mutationFromCounts({ mutations: 100, killed: 80 });
    const verdict = evaluateReleaseGate(
      report,
      {},
      { mutationTier: 'core', a11yTier: 'framework' },
    );
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(9);
  });

  it('T-QM-AT-022 tier + AI-LLM + a11yTier together evaluates 13 axes (11 + 2 tiers)', () => {
    const report: QualityReport = {
      ...baseReport(),
      provider: '@kiwa/ai-llm',
      cost: { perRequestUsd: 0.05, totalUsd: 5, requests: 100 },
      latency: { p50Ms: 500, p95Ms: 1500, p99Ms: 2500, samples: 100 },
      token: { promptTokens: 800, completionTokens: 400, totalTokens: 1200, requests: 100 },
      accuracy: { score: 0.92, samples: 50, method: 'cosine' },
      // SaaS tier: critical 0 / serious 0 / moderate 0 — all-zero passes.
      a11y: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    };
    report.mutation = mutationFromCounts({ mutations: 100, killed: 66 });
    const verdict = evaluateReleaseGate(
      report,
      {},
      { mutationTier: 'saas', a11yTier: 'saas' },
    );
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(13);
  });

  it('T-QM-AT-023 a11yTier accepts looser per-package override object', () => {
    // Test-type tier default moderate 10, override moderate 5 (stricter).
    const report = {
      ...baseReport(),
      a11y: { critical: 0, serious: 0, moderate: 4, minor: 0 },
    };
    const verdict = evaluateReleaseGate(report, {}, {
      a11yTier: 'test-type',
      a11yTierThreshold: { critical: 0, serious: 0, moderate: 5 },
    });
    expect(verdict.passed).toBe(true);
  });

  it('T-QM-AT-024 verbal tier label is accepted via resolveA11yTier', () => {
    const report = {
      ...baseReport(),
      a11y: { critical: 0, serious: 2, moderate: 8, minor: 0 },
    };
    const verdict = evaluateReleaseGate(report, {}, {
      a11yTier: resolveA11yTier('Test type'),
    });
    expect(verdict.passed).toBe(true);
  });

  it('T-QM-AT-025 missing report.a11y defaults every impact to fail-safe when a11yTier set', () => {
    // If a11yTier is set but report.a11y is undefined, critical is treated as
    // Infinity so the ceiling always fails — silent "no data" pass is worse
    // than a marker (mirrors AI-LLM axis default in gate.ts).
    const report = baseReport();
    const verdict = evaluateReleaseGate(report, {}, { a11yTier: 'core' });
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'a11y.tier');
    expect(blocker).toBeDefined();
  });

  it('T-QM-AT-026 type-level enum shape is stable SSOT', () => {
    // Static type sanity — the enum values are exactly the four tier keys,
    // same shape as MutationTier for one-pattern review.
    const tiers: A11yTier[] = ['core', 'framework', 'saas', 'test-type'];
    for (const t of tiers) {
      expect(DEFAULT_A11Y_TIER_THRESHOLDS[t]).toBeDefined();
      expect(DEFAULT_A11Y_TIER_THRESHOLDS[t].critical).toBe(0);
    }
  });
});
