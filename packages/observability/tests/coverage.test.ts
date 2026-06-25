import { describe, expect, it } from 'vitest';
import {
  checkThresholds,
  fromIstanbulCoverageSummary,
  renderDashboard,
  type CoverageSummary,
  type IstanbulCoverageSummary,
} from '../src/index.js';

const RAW: IstanbulCoverageSummary = {
  total: {
    statements: { total: 100, covered: 80, skipped: 0, pct: 80 },
    branches: { total: 40, covered: 30, skipped: 0, pct: 75 },
    functions: { total: 20, covered: 18, skipped: 0, pct: 90 },
    lines: { total: 100, covered: 82, skipped: 0, pct: 82 },
  },
  'src/foo.ts': {
    statements: { total: 50, covered: 40, skipped: 0, pct: 80 },
    branches: { total: 20, covered: 15, skipped: 0, pct: 75 },
    functions: { total: 10, covered: 9, skipped: 0, pct: 90 },
    lines: { total: 50, covered: 41, skipped: 0, pct: 82 },
  },
};

describe('fromIstanbulCoverageSummary', () => {
  it('extracts total + per-file entries', () => {
    const summary = fromIstanbulCoverageSummary(RAW);
    expect(summary.total.lines.pct).toBe(82);
    expect(summary.files.length).toBe(1);
    expect(summary.files[0]?.path).toBe('src/foo.ts');
  });

  it('synthesizes total when only file entries are provided', () => {
    const summary = fromIstanbulCoverageSummary({
      'src/a.ts': {
        statements: { total: 10, covered: 5, skipped: 0, pct: 50 },
        branches: { total: 4, covered: 2, skipped: 0, pct: 50 },
        functions: { total: 2, covered: 1, skipped: 0, pct: 50 },
        lines: { total: 10, covered: 5, skipped: 0, pct: 50 },
      },
      'src/b.ts': {
        statements: { total: 30, covered: 27, skipped: 0, pct: 90 },
        branches: { total: 8, covered: 7, skipped: 0, pct: 87.5 },
        functions: { total: 4, covered: 4, skipped: 0, pct: 100 },
        lines: { total: 30, covered: 27, skipped: 0, pct: 90 },
      },
    });
    expect(summary.total.path).toBe('total');
    expect(summary.total.lines.total).toBe(40);
    expect(summary.total.lines.covered).toBe(32);
    expect(summary.total.lines.pct).toBe(80);
  });
});

describe('checkThresholds', () => {
  it('passes when all metrics meet the threshold', () => {
    const summary = fromIstanbulCoverageSummary(RAW);
    const result = checkThresholds(summary, { lines: 80, branches: 70, functions: 85, statements: 80 });
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('reports each failing metric', () => {
    const summary = fromIstanbulCoverageSummary(RAW);
    const result = checkThresholds(summary, { lines: 95, branches: 90 });
    expect(result.ok).toBe(false);
    expect(result.failures.map((f) => f.metric).sort()).toEqual(['branches', 'lines']);
  });
});

describe('renderDashboard (with coverage)', () => {
  it('adds the Code coverage section when summary is provided', () => {
    const summary = fromIstanbulCoverageSummary(RAW);
    const dashboard = renderDashboard({
      history: { records: [] },
      flaky: [],
      gaps: [],
      coverage: summary as CoverageSummary,
    });
    expect(dashboard).toContain('## Code coverage');
    expect(dashboard).toContain('| lines | 82 | 100 | 82.0% |');
    expect(dashboard).toContain('| branches | 30 | 40 | 75.0% |');
  });

  it('emits a placeholder line when no coverage is provided', () => {
    const dashboard = renderDashboard({
      history: { records: [] },
      flaky: [],
      gaps: [],
    });
    expect(dashboard).toContain('## Code coverage');
    expect(dashboard).toContain('No coverage data provided');
  });
});
