import { describe, expect, it } from 'vitest';
import { buildReport, type RawInputs } from '../src/report-builder.js';

function passingInputs(overrides?: Partial<RawInputs>): RawInputs {
  return {
    provider: '@kiwa-test/example',
    version: '0.1.0',
    v8Summary: {
      lines: { pct: 92 },
      branches: { pct: 85 },
      functions: { pct: 95 },
    },
    testCounts: { behavior: 30, integration: 5, e2e: 2 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10 },
    perfSamplesMs: Array.from({ length: 100 }, (_, i) => i + 1),
    mutation: { mutations: 40, killed: 30 },
    ...overrides,
  };
}

describe('quality-metrics PoC — report builder', () => {
  it('T-QM-POC-001 assembles a passing report from raw inputs', () => {
    const out = buildReport(passingInputs());
    expect(out.verdict.passed).toBe(true);
    expect(out.report.testCount.total).toBe(37);
    expect(out.report.fidelity.ratio).toBe(80);
  });

  it('T-QM-POC-002 emits markdown containing a 5-axis summary', () => {
    const out = buildReport(passingInputs());
    expect(out.markdown).toContain('5-axis summary');
    expect(out.markdown).toContain('coverage — line');
    expect(out.markdown).toContain('mutation — killRate');
  });

  it('T-QM-POC-003 emits JSON that round-trips into the report shape', () => {
    const out = buildReport(passingInputs());
    const parsed = JSON.parse(out.json);
    expect(parsed.provider).toBe('@kiwa-test/example');
    expect(parsed.version).toBe('0.1.0');
  });

  it('T-QM-POC-004 flags coverage floor breach as blocker', () => {
    const out = buildReport(
      passingInputs({
        v8Summary: { lines: { pct: 40 }, branches: { pct: 20 }, functions: { pct: 30 } },
      }),
    );
    expect(out.verdict.passed).toBe(false);
    expect(out.verdict.blockers.map((b) => b.axis)).toEqual(
      expect.arrayContaining(['coverage.line', 'coverage.branch', 'coverage.function']),
    );
  });

  it('T-QM-POC-005 flags perf ceiling breach as blocker', () => {
    const out = buildReport(
      passingInputs({
        perfSamplesMs: Array.from({ length: 100 }, () => 250),
      }),
    );
    const blocker = out.verdict.blockers.find((b) => b.axis === 'perf.p95Ms');
    expect(blocker).toBeDefined();
    expect(blocker?.actual).toBeGreaterThan(100);
  });

  it('T-QM-POC-006 flags mutation kill-rate breach', () => {
    const out = buildReport(passingInputs({ mutation: { mutations: 100, killed: 10 } }));
    const blocker = out.verdict.blockers.find((b) => b.axis === 'mutation.killRate');
    expect(blocker).toBeDefined();
    expect(blocker?.actual).toBe(10);
  });

  it('T-QM-POC-007 accepts behavioralDivergences in the fidelity axis', () => {
    const out = buildReport(
      passingInputs({
        fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, behavioralDivergences: 3 },
      }),
    );
    expect(out.report.fidelity.behavioralDivergences).toBe(3);
    expect(out.markdown).toContain('behavioralDivergences');
  });

  it('T-QM-POC-008 propagates notes into the emitted markdown', () => {
    const out = buildReport(passingInputs({ notes: 'v0.1 initial release' }));
    expect(out.markdown).toContain('## Notes');
    expect(out.markdown).toContain('v0.1 initial release');
  });
});
