import { describe, expect, it } from 'vitest';
import {
  detectFlaky,
  renderDashboard,
  type RunHistory,
  type SpecCoverageGap,
  type TestRunRecord,
} from '../src/index.js';

function rec(testId: string, status: 'passed' | 'failed' | 'skipped'): TestRunRecord {
  return { testId, fullName: `${testId} sample`, status, durationMs: 1, runId: 'r', startedAt: 0 };
}

describe('renderDashboard', () => {
  it('renders an empty dashboard cleanly', () => {
    const out = renderDashboard({
      history: { records: [] },
      flaky: [],
      gaps: [],
    });
    expect(out).toContain('# kiwa observability dashboard');
    expect(out).toContain('No flaky tests detected');
    expect(out).toContain('No spec coverage gaps detected');
  });

  it('summarizes pass / fail / skipped totals', () => {
    const history: RunHistory = {
      records: [
        rec('T-A-001', 'passed'),
        rec('T-A-002', 'failed'),
        rec('T-A-003', 'skipped'),
      ],
    };
    const out = renderDashboard({ history, flaky: [], gaps: [] });
    expect(out).toContain('| total records | 3 |');
    expect(out).toContain('| passes | 1 |');
    expect(out).toContain('| failures | 1 |');
    expect(out).toContain('| skipped | 1 |');
    expect(out).toContain('| pass rate | 50.0% |');
  });

  it('renders detected flaky tests as a table', () => {
    const history: RunHistory = {
      records: [
        rec('T-A-001', 'passed'),
        rec('T-A-001', 'failed'),
        rec('T-A-001', 'passed'),
      ],
    };
    const flaky = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    const out = renderDashboard({ history, flaky, gaps: [] });
    expect(out).toContain('| T-A-001 |');
    expect(out).toContain('33.3%');
  });

  it('renders coverage gaps per module', () => {
    const gap: SpecCoverageGap = {
      module: 'items',
      layer: 'api',
      missingTcIds: ['T-API-001', 'T-API-002'],
      extraTcIds: ['T-API-999'],
    };
    const out = renderDashboard({
      history: { records: [] },
      flaky: [],
      gaps: [gap],
    });
    expect(out).toContain('### items (api)');
    expect(out).toContain('- T-API-001');
    expect(out).toContain('- T-API-999');
  });
});
