import { describe, expect, it } from 'vitest';
import {
  diffReports,
  emitJson,
  emitMarkdown,
  evaluateReleaseGate,
  type QualityReport,
} from '../src/index.js';

function baseReport(overrides?: Partial<QualityReport>): QualityReport {
  return {
    provider: '@kiwa-lab/example',
    version: '0.1.0',
    reportedAt: '2026-07-02T00:00:00Z',
    coverage: { line: 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: 70 },
    ...overrides,
  };
}

describe('emitMarkdown', () => {
  it('T-QM-EM-001 renders a 5-axis summary table', () => {
    const md = emitMarkdown({ report: baseReport() });
    expect(md).toContain('# Quality Report');
    expect(md).toContain('coverage — line');
    expect(md).toContain('coverage — branch');
    expect(md).toContain('coverage — function');
    expect(md).toContain('test count — total');
    expect(md).toContain('fidelity — ratio');
    expect(md).toContain('perf — p95');
    expect(md).toContain('mutation — killRate');
  });

  it('T-QM-EM-002 renders release gate section when verdict is supplied', () => {
    const report = baseReport();
    const verdict = evaluateReleaseGate(report);
    const md = emitMarkdown({ report, verdict });
    expect(md).toContain('## Release gate');
    expect(md).toContain('verdict: **PASS**');
  });

  it('T-QM-EM-003 lists blockers when gate fails', () => {
    const report = baseReport({
      coverage: { line: 20, branch: 20, function: 20 },
    });
    const verdict = evaluateReleaseGate(report);
    const md = emitMarkdown({ report, verdict });
    expect(md).toContain('verdict: **FAIL**');
    expect(md).toContain('### Blockers');
    expect(md).toContain('coverage.line');
  });

  it('T-QM-EM-004 renders diff section when supplied', () => {
    const prev = baseReport();
    const cur = baseReport({ version: '0.2.0', coverage: { line: 95, branch: 90, function: 98 } });
    const diff = diffReports(prev, cur);
    const md = emitMarkdown({ report: cur, diff });
    expect(md).toContain('## Trend vs prior version');
    expect(md).toContain('coverage.line');
    expect(md).toContain('+5.00');
  });

  it('T-QM-EM-005 renders behavioralDivergences when present', () => {
    const report = baseReport();
    report.fidelity.behavioralDivergences = 4;
    const md = emitMarkdown({ report });
    expect(md).toContain('behavioralDivergences');
    expect(md).toContain('| 4 |');
  });

  it('T-QM-EM-006 renders notes when present', () => {
    const md = emitMarkdown({ report: baseReport({ notes: 'first release' }) });
    expect(md).toContain('## Notes');
    expect(md).toContain('first release');
  });
});

describe('emitJson', () => {
  it('T-QM-EM-007 emits pretty-printed JSON that round-trips', () => {
    const report = baseReport();
    const json = emitJson(report);
    expect(json).toContain('\n  "provider"');
    expect(JSON.parse(json)).toEqual(report);
  });
});

describe('diffReports', () => {
  it('T-QM-EM-008 computes delta values across all axes', () => {
    const prev = baseReport();
    const cur = baseReport({
      version: '0.2.0',
      coverage: { line: 95, branch: 90, function: 98 },
      testCount: { behavior: 30, integration: 8, e2e: 3, total: 41 },
      fidelity: { mockCoveredMethods: 9, realTotalMethods: 10, ratio: 90 },
      perf: { p50Ms: 3, p95Ms: 30, p99Ms: 60, samples: 100 },
      mutation: { mutations: 50, killed: 45, survived: 5, killRate: 90 },
    });
    const diff = diffReports(prev, cur);
    expect(diff.from).toBe('0.1.0');
    expect(diff.to).toBe('0.2.0');
    expect(diff.coverage.line).toBe(5);
    expect(diff.testCount.total).toBe(14);
    expect(diff.fidelity.ratio).toBe(10);
    expect(diff.perf.p95Ms).toBe(-20);
    expect(diff.mutation.killRate).toBe(20);
  });

  it('T-QM-EM-009 refuses diffing across different providers', () => {
    const a = baseReport({ provider: '@kiwa-lab/one' });
    const b = baseReport({ provider: '@kiwa-lab/two' });
    expect(() => diffReports(a, b)).toThrow(/provider mismatch/);
  });
});

function aiLlmReport(overrides?: Partial<QualityReport>): QualityReport {
  return {
    ...baseReport({ provider: '@kiwa-lab/ai-llm' }),
    cost: { perRequestUsd: 0.05, totalUsd: 5.0, requests: 100 },
    latency: { p50Ms: 500, p95Ms: 1500, p99Ms: 2500, samples: 100 },
    token: { promptTokens: 800, completionTokens: 400, totalTokens: 1200, requests: 100 },
    accuracy: { score: 0.92, samples: 50, method: 'cosine' },
    ...overrides,
  };
}

describe('emitMarkdown — AI-LLM provider', () => {
  it('T-QM-EM-010 renders 11-axis label and cost / latency / token / accuracy rows', () => {
    const md = emitMarkdown({ report: aiLlmReport() });
    expect(md).toContain('11-axis summary');
    expect(md).toContain('cost — perRequestUsd');
    expect(md).toContain('$0.0500');
    expect(md).toContain('latency — p95');
    expect(md).toContain('token — total');
    expect(md).toContain('accuracy — score');
    expect(md).toContain('cosine');
  });

  it('T-QM-EM-011 renders release gate section with 11 axes for AI-LLM', () => {
    const report = aiLlmReport();
    const verdict = evaluateReleaseGate(report);
    const md = emitMarkdown({ report, verdict });
    expect(md).toContain('verdict: **PASS**');
    expect(md).toContain('axes evaluated: 11');
  });

  it('T-QM-EM-012 renders blocker rows for AI-LLM failures', () => {
    const report = aiLlmReport({
      accuracy: { score: 0.3, samples: 50, method: 'cosine' },
    });
    const verdict = evaluateReleaseGate(report);
    const md = emitMarkdown({ report, verdict });
    expect(md).toContain('accuracy.score');
    expect(md).toContain('verdict: **FAIL**');
  });

  it('T-QM-EM-013 renders diff section with AI-LLM delta rows', () => {
    const prev = aiLlmReport();
    const cur = aiLlmReport({
      version: '0.2.0',
      cost: { perRequestUsd: 0.03, totalUsd: 3.0, requests: 100 },
      latency: { p50Ms: 300, p95Ms: 1000, p99Ms: 2000, samples: 100 },
      token: { promptTokens: 500, completionTokens: 300, totalTokens: 800, requests: 100 },
      accuracy: { score: 0.95, samples: 50, method: 'cosine' },
    });
    const diff = diffReports(prev, cur);
    const md = emitMarkdown({ report: cur, diff });
    expect(md).toContain('cost.perRequestUsd');
    expect(md).toContain('latency.p95Ms');
    expect(md).toContain('token.totalTokens');
    expect(md).toContain('accuracy.score');
    // cost decreased by 0.02 → -0.02
    expect(md).toContain('-0.02');
  });
});

describe('diffReports — AI-LLM 4 axes', () => {
  it('T-QM-EM-014 emits cost / latency / token / accuracy diffs when both reports have them', () => {
    const prev = aiLlmReport();
    const cur = aiLlmReport({
      version: '0.2.0',
      cost: { perRequestUsd: 0.08, totalUsd: 8.0, requests: 100 },
      latency: { p50Ms: 600, p95Ms: 1600, p99Ms: 2700, samples: 100 },
      token: { promptTokens: 900, completionTokens: 500, totalTokens: 1400, requests: 100 },
      accuracy: { score: 0.95, samples: 50, method: 'cosine' },
    });
    const diff = diffReports(prev, cur);
    expect(diff.cost?.perRequestUsd).toBeCloseTo(0.03);
    expect(diff.latency?.p95Ms).toBe(100);
    expect(diff.token?.totalTokens).toBe(200);
    expect(diff.accuracy?.score).toBeCloseTo(0.03);
  });

  it('T-QM-EM-015 omits AI-LLM diff when either report is missing the axis', () => {
    const prev = baseReport({ provider: '@kiwa-lab/ai-llm' });
    const cur = aiLlmReport();
    const diff = diffReports(prev, cur);
    expect(diff.cost).toBeUndefined();
    expect(diff.latency).toBeUndefined();
    expect(diff.token).toBeUndefined();
    expect(diff.accuracy).toBeUndefined();
  });

  it('T-QM-EM-016 renders a11y row when report.a11y is present', () => {
    // The `if (report.a11y)` block in emitMarkdown was uncovered — every
    // existing test used a baseReport without an a11y axis.
    const md = emitMarkdown({
      report: baseReport({
        a11y: { critical: 0, serious: 1, moderate: 2, minor: 3 },
      }),
    });
    expect(md).toContain('a11y — critical / serious / moderate');
    expect(md).toContain('0 / 1 / 2 (minor 3)');
  });

  it('T-QM-EM-017 diff table lists a11y rows and diffReports computes the axis', () => {
    // Two paths in one test:
    //   emit.js:110-114 — the `if (diff.a11y)` block rendering three rows.
    //   emit.js:183-193 — diffReports assembling `out.a11y` from prev/cur.
    const prev = baseReport({
      a11y: { critical: 2, serious: 3, moderate: 4, minor: 5 },
    });
    const cur = baseReport({
      a11y: { critical: 1, serious: 1, moderate: 2, minor: 5 },
    });
    const diff = diffReports(prev, cur);
    expect(diff.a11y).toEqual({ critical: -1, serious: -2, moderate: -2 });
    const md = emitMarkdown({ report: cur, diff });
    expect(md).toContain('a11y.critical');
    expect(md).toContain('a11y.serious');
    expect(md).toContain('a11y.moderate');
  });

  it('T-QM-EM-018 omits the a11y diff when either side is missing the axis', () => {
    const prev = baseReport();
    const cur = baseReport({
      a11y: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    });
    const diff = diffReports(prev, cur);
    expect(diff.a11y).toBeUndefined();
  });
});
