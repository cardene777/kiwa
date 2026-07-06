import type { QualityReport, ReleaseGateVerdict } from './types.js';
import type { QualityReportDiff } from './types.js';
import { isAiLlmProvider } from './types.js';

/**
 * Emit a human-readable markdown report from a {@link QualityReport}. The
 * output shape mirrors what `docs/quality-reports/{package}-{version}.md`
 * consumers expect. When `verdict` is supplied, an additional release-gate
 * section is appended. AI-LLM provider の場合は 4 軸行が追加される。
 */
export function emitMarkdown(input: {
  report: QualityReport;
  verdict?: ReleaseGateVerdict;
  diff?: QualityReportDiff;
}): string {
  const { report, verdict, diff } = input;
  const isAi = isAiLlmProvider(report.provider);
  const lines: string[] = [];
  lines.push(`# Quality Report — ${report.provider} @ ${report.version}`);
  lines.push('');
  lines.push(`_Reported at ${report.reportedAt}._`);
  lines.push('');

  // Base axis count in the summary section (7 mandatory axes minus 2 that
  // fit into a single row each = 5 rows for non-AI-LLM). AI-LLM adds 4 more.
  // v1.30-4: a11y adds 1 row when present; other tier-aware axes (mutation
  // tier context) do not add rows because they reuse the mutation.killRate row.
  const baseRows = isAi ? 11 : 5;
  const a11yRows = report.a11y ? 1 : 0;
  const axesLabel = `${baseRows + a11yRows}-axis`;
  lines.push(`## ${axesLabel} summary`);
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

  if (isAi) {
    if (report.cost) {
      lines.push(`| cost — perRequestUsd | $${report.cost.perRequestUsd.toFixed(4)} (${report.cost.requests} requests, total $${report.cost.totalUsd.toFixed(4)}) |`);
    }
    if (report.latency) {
      lines.push(`| latency — p50 | ${report.latency.p50Ms.toFixed(2)}ms |`);
      lines.push(`| latency — p95 | ${report.latency.p95Ms.toFixed(2)}ms |`);
      lines.push(`| latency — p99 | ${report.latency.p99Ms.toFixed(2)}ms |`);
    }
    if (report.token) {
      lines.push(`| token — total | ${report.token.totalTokens.toFixed(0)} (prompt ${report.token.promptTokens.toFixed(0)} + completion ${report.token.completionTokens.toFixed(0)}) |`);
    }
    if (report.accuracy) {
      lines.push(`| accuracy — score | ${report.accuracy.score.toFixed(4)} (${report.accuracy.method}, ${report.accuracy.samples} samples) |`);
    }
  }
  // v1.30-4: a11y axis (WCAG 2.1 AA impact counts) — present on any provider
  // that opts into the tier-aware gate, not just AI-LLM。 critical / serious /
  // moderate は release gate 判定対象、 minor は team review 用に併記する。
  if (report.a11y) {
    lines.push(
      `| a11y — critical / serious / moderate | ${report.a11y.critical} / ${report.a11y.serious} / ${report.a11y.moderate} (minor ${report.a11y.minor}) |`,
    );
  }
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
    if (diff.cost) {
      lines.push(`| cost.perRequestUsd | ${formatDelta(diff.cost.perRequestUsd)} (negative is better) |`);
    }
    if (diff.latency) {
      lines.push(`| latency.p95Ms | ${formatDelta(diff.latency.p95Ms)} (negative is better) |`);
    }
    if (diff.token) {
      lines.push(`| token.totalTokens | ${formatDelta(diff.token.totalTokens)} (negative is better) |`);
    }
    if (diff.accuracy) {
      lines.push(`| accuracy.score | ${formatDelta(diff.accuracy.score)} |`);
    }
    if (diff.a11y) {
      lines.push(`| a11y.critical | ${formatDelta(diff.a11y.critical)} (negative is better) |`);
      lines.push(`| a11y.serious | ${formatDelta(diff.a11y.serious)} (negative is better) |`);
      lines.push(`| a11y.moderate | ${formatDelta(diff.a11y.moderate)} (negative is better) |`);
    }
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
 * labels next to each axis. AI-LLM 4 軸は両 report が該当 field を持つ場合
 * のみ diff を計算する。
 */
export function diffReports(previous: QualityReport, current: QualityReport): QualityReportDiff {
  if (previous.provider !== current.provider) {
    throw new Error(
      `diffReports: provider mismatch — ${previous.provider} vs ${current.provider}`,
    );
  }
  const out: QualityReportDiff = {
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
  if (previous.cost && current.cost) {
    out.cost = { perRequestUsd: current.cost.perRequestUsd - previous.cost.perRequestUsd };
  }
  if (previous.latency && current.latency) {
    out.latency = { p95Ms: current.latency.p95Ms - previous.latency.p95Ms };
  }
  if (previous.token && current.token) {
    out.token = { totalTokens: current.token.totalTokens - previous.token.totalTokens };
  }
  if (previous.accuracy && current.accuracy) {
    out.accuracy = { score: current.accuracy.score - previous.accuracy.score };
  }
  if (previous.a11y && current.a11y) {
    // v1.30-4: negative delta = fewer violations = improvement (mirrors perf
    // / latency / cost / token direction convention). Only 3 impact axes
    // release gate checks; minor is team-review only and skipped from the
    // diff shape (QualityReportDiff.a11y type).
    out.a11y = {
      critical: current.a11y.critical - previous.a11y.critical,
      serious: current.a11y.serious - previous.a11y.serious,
      moderate: current.a11y.moderate - previous.a11y.moderate,
    };
  }
  return out;
}

function formatDelta(v: number): string {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}`;
}
