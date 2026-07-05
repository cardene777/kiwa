/**
 * v1.27-5 docs 補強 (Issue #960) — tutorial 50-51 code snippet 検証。
 *
 * `docs/tutorials/50-mutation-testing-baseline.md` /
 * `docs/tutorials/51-mutation-baseline-migration.md` に載っている code snippet が
 * 実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。 v1.17 / v1.19 / v1.20 /
 * v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 の docs-tutorial-v*.test.ts と
 * 同 pattern。 5 milestone 連続 pattern (v1.23-v1.27) を確立する。
 *
 * v1.27 は @kiwa-test/quality-metrics v0.3 の 4-tier mutation SSOT + 12-axis
 * release gate を扱う。 tutorial 50 は Stryker setup + baseline persistence +
 * tier gate walkthrough、 tutorial 51 は 22 → 33 package migration
 * methodology + tier + optional override。 tutorial 内の TypeScript snippet
 * (target function + tier assert + release gate + assembleReport) を behavior
 * test で 1:1 に走らせる。 stryker.config.mjs / JSON baseline snippet は
 * behavior test の対象外 (shell command / json file であり mutation-tier
 * API とは切り離されるため)。
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MUTATION_TIER_THRESHOLDS,
  assembleReport,
  assertMutationTier,
  coverageFromV8Summary,
  evaluateReleaseGate,
  fidelityFromMethodCounts,
  mutationFromCounts,
  perfFromSamples,
  resolveMutationTier,
  testCountFromCategories,
  type MutationTier,
  type QualityReport,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 50 — Mutation testing baseline
// ---------------------------------------------------------------------------

// Section 2 — Write the target function
function classifyKillRate(rate: number): 'green' | 'yellow' | 'red' {
  if (rate >= 80) return 'green';
  if (rate >= 60) return 'yellow';
  return 'red';
}

describe('tutorial 50 — classifyKillRate target function', () => {
  it('returns green at or above 80', () => {
    expect(classifyKillRate(80)).toBe('green');
    expect(classifyKillRate(95)).toBe('green');
  });

  it('returns yellow at 60-79', () => {
    expect(classifyKillRate(60)).toBe('yellow');
    expect(classifyKillRate(79)).toBe('yellow');
  });

  it('returns red below 60', () => {
    expect(classifyKillRate(59)).toBe('red');
    expect(classifyKillRate(0)).toBe('red');
  });
});

describe('tutorial 50 — Section 6: tier gate', () => {
  it('passes when kill-rate meets Core tier floor via resolveMutationTier("Core")', () => {
    const metric = mutationFromCounts({ mutations: 8, killed: 8 });
    expect(() =>
      assertMutationTier({ metric, tier: resolveMutationTier('Core') }),
    ).not.toThrow();
  });

  it('fails when kill-rate drops below Core tier floor with actionable message', () => {
    const metric = mutationFromCounts({ mutations: 8, killed: 5 });
    expect(() =>
      assertMutationTier({ metric, tier: 'core' }),
    ).toThrow(/core.*80/);
  });

  it('rejects an empty suite as "no mutation signal"', () => {
    const metric = mutationFromCounts({ mutations: 0, killed: 0 });
    expect(() =>
      assertMutationTier({ metric, tier: 'core' }),
    ).toThrow(/no mutation signal/i);
  });
});

// Section 7 — Gate the release with the 12th axis
function baseReportForRelease(): QualityReport {
  return {
    provider: '@kiwa-test/example',
    version: '0.1.0',
    reportedAt: '2026-07-05T00:00:00Z',
    coverage: { line: 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 100, killed: 80, survived: 20, killRate: 80 },
  };
}

describe('tutorial 50 — Section 7: 12-axis release gate', () => {
  it('adds a 12th axis when mutationTier is passed', () => {
    const verdict = evaluateReleaseGate(
      baseReportForRelease(),
      {},
      { mutationTier: 'core' },
    );
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(8);
  });

  it('blocks a report when kill-rate falls below the Core tier floor', () => {
    const report = baseReportForRelease();
    report.mutation = mutationFromCounts({ mutations: 100, killed: 70 });
    const verdict = evaluateReleaseGate(report, {}, { mutationTier: 'core' });
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'mutation.tier');
    expect(blocker?.threshold).toBe(80);
    expect(blocker?.actual).toBe(70);
  });

  it('accepts a looser per-package override when the SSOT documents one', () => {
    const report = baseReportForRelease();
    report.mutation = mutationFromCounts({ mutations: 100, killed: 66 });
    const verdict = evaluateReleaseGate(
      report,
      {},
      { mutationTier: 'framework', mutationTierThreshold: 65 },
    );
    expect(verdict.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 51 — Mutation baseline migration
// ---------------------------------------------------------------------------

describe('tutorial 51 — Section 1: 4-tier SSOT table', () => {
  it('DEFAULT_MUTATION_TIER_THRESHOLDS exposes the SSOT high column', () => {
    expect(DEFAULT_MUTATION_TIER_THRESHOLDS).toEqual({
      core: 80,
      framework: 70,
      saas: 65,
      'test-type': 60,
    });
  });

  it('Framework tier floor is 70 — matches @kiwa-test/nextjs stryker config', () => {
    expect(DEFAULT_MUTATION_TIER_THRESHOLDS.framework).toBe(70);
  });

  it('SaaS tier floor is 65 — matches @kiwa-test/ai-llm / payment / queue defaults', () => {
    expect(DEFAULT_MUTATION_TIER_THRESHOLDS.saas).toBe(65);
  });

  it('Test type tier floor is 60 — matches @kiwa-test/ui / a11y / visual defaults', () => {
    expect(DEFAULT_MUTATION_TIER_THRESHOLDS['test-type']).toBe(60);
  });
});

describe('tutorial 51 — Section 6: 12-axis release gate via assembleReport', () => {
  it('passes the SaaS tier floor when the mutation baseline holds', () => {
    const report = assembleReport({
      provider: '@kiwa-test/my-package',
      version: '0.1.0',
      coverage: coverageFromV8Summary({
        lines: { pct: 90 },
        branches: { pct: 82 },
        functions: { pct: 95 },
      }),
      testCount: testCountFromCategories({ behavior: 20, integration: 5, e2e: 2 }),
      fidelity: fidelityFromMethodCounts({ mockCoveredMethods: 8, realTotalMethods: 10 }),
      perf: perfFromSamples([5, 5, 5, 5, 5]),
      mutation: mutationFromCounts({ mutations: 167, killed: 115 }),
    });

    const verdict = evaluateReleaseGate(report, {}, {
      mutationTier: resolveMutationTier('SaaS'),
    });

    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(8);
  });

  it('surfaces both mutation.killRate and mutation.tier when the tier floor is missed', () => {
    // Migration guide + concept doc example: legacy override on the 7-axis
    // path AND opt-in tier axis both surface when kill rate falls below both.
    const report = assembleReport({
      provider: '@kiwa-test/example',
      version: '0.1.0',
      coverage: coverageFromV8Summary({
        lines: { pct: 90 },
        branches: { pct: 82 },
        functions: { pct: 95 },
      }),
      testCount: testCountFromCategories({ behavior: 20, integration: 5, e2e: 2 }),
      fidelity: fidelityFromMethodCounts({ mockCoveredMethods: 8, realTotalMethods: 10 }),
      perf: perfFromSamples([5, 5, 5, 5, 5]),
      mutation: mutationFromCounts({ mutations: 100, killed: 50 }),
    });

    const verdict = evaluateReleaseGate(
      report,
      { mutationKillRate: 55 },
      { mutationTier: 'core' },
    );
    const axes = verdict.blockers.map((b) => b.axis);
    expect(axes).toContain('mutation.killRate'); // 50 < 55 legacy
    expect(axes).toContain('mutation.tier'); // 50 < 80 tier
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting — MutationTier enum + resolveMutationTier normalisation
// ---------------------------------------------------------------------------

describe('tutorial 50 + 51 — MutationTier + resolveMutationTier', () => {
  it('type-level enum shape has exactly four members', () => {
    const tiers: MutationTier[] = ['core', 'framework', 'saas', 'test-type'];
    for (const t of tiers) {
      expect(DEFAULT_MUTATION_TIER_THRESHOLDS[t]).toBeGreaterThan(0);
    }
  });

  it('resolveMutationTier maps the verbal labels used in baseline JSON', () => {
    // Baseline JSON writes the verbal tier used in docs/quality/mutation-thresholds.md.
    expect(resolveMutationTier('Core')).toBe('core');
    expect(resolveMutationTier('Framework')).toBe('framework');
    expect(resolveMutationTier('SaaS')).toBe('saas');
    expect(resolveMutationTier('Test type')).toBe('test-type');
  });

  it('resolveMutationTier accepts the enum spellings unchanged', () => {
    expect(resolveMutationTier('core')).toBe('core');
    expect(resolveMutationTier('framework')).toBe('framework');
    expect(resolveMutationTier('saas')).toBe('saas');
    expect(resolveMutationTier('test-type')).toBe('test-type');
  });

  it('resolveMutationTier is case-insensitive and trims whitespace', () => {
    expect(resolveMutationTier(' CORE ')).toBe('core');
    expect(resolveMutationTier('framework ')).toBe('framework');
    expect(resolveMutationTier('Saas')).toBe('saas');
    expect(resolveMutationTier('TEST TYPE')).toBe('test-type');
  });

  it('resolveMutationTier throws on unknown labels — silent drift refused', () => {
    expect(() => resolveMutationTier('unknown')).toThrow(/unknown mutation tier/i);
    expect(() => resolveMutationTier('')).toThrow(/unknown mutation tier/i);
  });
});
