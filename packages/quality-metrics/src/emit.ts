import type { QualityReport, ReleaseGateVerdict } from './types.js';
import type { QualityReportDiff } from './types.js';

/**
 * Emit a human-readable markdown report from a {@link QualityReport}. The
 * output shape mirrors what `docs/quality-reports/{package}-{version}.md`
 * consumers expect. When `verdict` is supplied, an additional release-gate
 * section is appended.
 */
export function emitMarkdown(input: {
  report: QualityReport;
  verdict?: ReleaseGateVerdict;
  diff?: QualityReportDiff;
}): string {
  const { report, verdict, diff } = input;
  const lines: string[] = [];
  lines.push(`# Quality Report — ${report.provider} @ ${report.version}`);
  lines.push('');
  lines.push(`_Reported at ${report.reportedAt}._`);
  lines.push('');

  lines.push('## 5-axis summary');
  lines.push('');
  lines.push('| axis | value |');
  lines.push('|---|---|');
  lines.push(`| coverage — line | ${report.coverage.line.toFixed(2)}% |`);
  lines.push(`| coverage — branch | ${report.coverage.branch.toFixed(2)}% |`);
  lines.push(`| coverage — function | ${report.coverage.function.toFixed(2)}% |`);
  lines.push(`| test count — total | ${report.testCount.total} |`);
  lines.push(`| test count — behavior | ${report.testCount.behavior} |`);
  lines.push(`| test count — integration | ${report.testCount.integration} |`);
  lines.push(`| test count — e2e | ${report.testCount.e2e} |`);
  lines.push(`| fidelity — ratio | ${report.fidelity.ratio.toFixed(2)}% (${report.fidelity.mockCoveredMethods}/${report.fidelity.realTotalMethods}) |`);
  if (report.fidelity.behavioralDivergences !== undefined) {
    lines.push(`| fidelity — behavioralDivergences | ${report.fidelity.behavioralDivergences} |`);
  }
  lines.push(`| perf — p50 | ${report.perf.p50Ms.toFixed(2)}ms |`);
  lines.push(`| perf — p95 | ${report.perf.p95Ms.toFixed(2)}ms |`);
  lines.push(`| perf — p99 | ${report.perf.p99Ms.toFixed(2)}ms |`);
  lines.push(`| perf — samples | ${report.perf.samples} |`);
  lines.push(`| mutation — killRate | ${report.mutation.killRate.toFixed(2)}% (${report.mutation.killed}/${report.mutation.mutations}) |`);
  lines.push(`| mutation — survived | ${report.mutation.survived} |`);
  lines.push('');

  if (verdict) {
    lines.push('## Release gate');
    lines.push('');
    lines.push(`- verdict: **${verdict.passed ? 'PASS' : 'FAIL'}**`);
    lines.push(`- axes evaluated: ${verdict.axesEvaluated}`);
    if (verdict.blockers.length > 0) {
      lines.push('');
      lines.push('### Blockers');
      lines.push('');
      lines.push('| axis | operator | threshold | actual |');
      lines.push('|---|---|---|---|');
      for (const b of verdict.blockers) {
        lines.push(`| ${b.axis} | ${b.op} | ${b.threshold} | ${b.actual.toFixed(2)} |`);
      }
    }
    lines.push('');
  }

  if (diff) {
    lines.push('## Trend vs prior version');
    lines.push('');
    lines.push(`_From ${diff.from} → ${diff.to}._`);
    lines.push('');
    lines.push('| axis | delta |');
    lines.push('|---|---|');
    lines.push(`| coverage.line | ${formatDelta(diff.coverage.line)} |`);
    lines.push(`| coverage.branch | ${formatDelta(diff.coverage.branch)} |`);
    lines.push(`| coverage.function | ${formatDelta(diff.coverage.function)} |`);
    lines.push(`| testCount.total | ${formatDelta(diff.testCount.total)} |`);
    lines.push(`| fidelity.ratio | ${formatDelta(diff.fidelity.ratio)} |`);
    lines.push(`| perf.p95Ms | ${formatDelta(diff.perf.p95Ms)} (negative is better) |`);
    lines.push(`| mutation.killRate | ${formatDelta(diff.mutation.killRate)} |`);
    lines.push('');
  }

  if (report.notes) {
    lines.push('## Notes');
    lines.push('');
    lines.push(report.notes);
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * Emit the report as JSON — the machine-readable counterpart consumers use
 * to persist raw metrics under `docs/quality-reports/`. Pretty-printed with
 * 2-space indentation.
 */
export function emitJson(report: QualityReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Compute a diff between two reports for the same provider. Values are
 * (`current - previous`) so callers can render "improved" / "regressed"
 * labels next to each axis.
 */
export function diffReports(previous: QualityReport, current: QualityReport): QualityReportDiff {
  if (previous.provider !== current.provider) {
    throw new Error(
      `diffReports: provider mismatch — ${previous.provider} vs ${current.provider}`,
    );
  }
  return {
    provider: current.provider,
    from: previous.version,
    to: current.version,
    coverage: {
      line: current.coverage.line - previous.coverage.line,
      branch: current.coverage.branch - previous.coverage.branch,
      function: current.coverage.function - previous.coverage.function,
    },
    testCount: {
      behavior: current.testCount.behavior - previous.testCount.behavior,
      integration: current.testCount.integration - previous.testCount.integration,
      e2e: current.testCount.e2e - previous.testCount.e2e,
      total: current.testCount.total - previous.testCount.total,
    },
    fidelity: {
      ratio: current.fidelity.ratio - previous.fidelity.ratio,
    },
    perf: {
      p50Ms: current.perf.p50Ms - previous.perf.p50Ms,
      p95Ms: current.perf.p95Ms - previous.perf.p95Ms,
      p99Ms: current.perf.p99Ms - previous.perf.p99Ms,
      samples: current.perf.samples - previous.perf.samples,
    },
    mutation: {
      killRate: current.mutation.killRate - previous.mutation.killRate,
    },
  };
}

function formatDelta(v: number): string {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}`;
}
