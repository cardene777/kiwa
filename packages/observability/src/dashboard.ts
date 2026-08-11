import type { DashboardInput } from './types.js';

function summarize(input: DashboardInput): {
  totalRecords: number;
  passes: number;
  failures: number;
  skipped: number;
  passRate: number;
} {
  let passes = 0;
  let failures = 0;
  let skipped = 0;
  for (const rec of input.history.records) {
    if (rec.status === 'passed') passes += 1;
    else if (rec.status === 'failed') failures += 1;
    else skipped += 1;
  }
  const total = input.history.records.length;
  const denom = passes + failures;
  return {
    totalRecords: total,
    passes,
    failures,
    skipped,
    passRate: denom > 0 ? passes / denom : 1,
  };
}

export function renderDashboard(input: DashboardInput): string {
  const summary = summarize(input);
  const lines: string[] = [];
  lines.push('# kiwa observability dashboard');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| metric | value |`);
  lines.push(`|---|---|`);
  lines.push(`| total records | ${summary.totalRecords} |`);
  lines.push(`| passes | ${summary.passes} |`);
  lines.push(`| failures | ${summary.failures} |`);
  lines.push(`| skipped | ${summary.skipped} |`);
  lines.push(`| pass rate | ${(summary.passRate * 100).toFixed(1)}% |`);
  lines.push('');

  lines.push('## Flaky tests');
  lines.push('');
  if (input.flaky.length === 0) {
    lines.push('No flaky tests detected.');
  } else {
    lines.push(`| testId | failure rate | runs (pass / fail) | name |`);
    lines.push(`|---|---|---|---|`);
    for (const f of input.flaky) {
      lines.push(
        `| ${f.testId} | ${(f.failureRate * 100).toFixed(1)}% | ${f.totalRuns} (${f.passes} / ${f.failures}) | ${f.fullName} |`,
      );
    }
  }
  lines.push('');

  lines.push('## Code coverage');
  lines.push('');
  if (!input.coverage) {
    lines.push('No coverage data provided.');
  } else {
    const t = input.coverage.total;
    lines.push('| metric | covered | total | pct |');
    lines.push('|---|---|---|---|');
    lines.push(`| lines | ${t.lines.covered} | ${t.lines.total} | ${t.lines.pct.toFixed(1)}% |`);
    lines.push(`| statements | ${t.statements.covered} | ${t.statements.total} | ${t.statements.pct.toFixed(1)}% |`);
    lines.push(`| branches | ${t.branches.covered} | ${t.branches.total} | ${t.branches.pct.toFixed(1)}% |`);
    lines.push(`| functions | ${t.functions.covered} | ${t.functions.total} | ${t.functions.pct.toFixed(1)}% |`);
  }
  lines.push('');

  lines.push('## Spec coverage gaps');
  lines.push('');
  if (input.gaps.length === 0) {
    lines.push('No spec coverage gaps detected.');
  } else {
    for (const gap of input.gaps) {
      lines.push(`### ${gap.module} (${gap.layer})`);
      lines.push('');
      // 未解析の警告は gap の有無から独立して出す。 一致した時だけ出す形にすると、
      // spec を読めていないのに test 側に既知形式の id があった場合に警告が消え、
      // 「Extra TC IDs」 だけが並ぶ = 読み手は parser / spec 形式の問題に気付けない
      // (#1910 Round 1)。 読めていない以上、 その id を extra と断定もできない。
      if (gap.specCaseCount === 0) {
        lines.push('spec から case を 1 件も読めなかった。 gap の有無は判定していない.');
        lines.push('');
        if (gap.extraTcIds.length > 0) {
          lines.push('test 側で見つかった ID (spec を読めていないため extra とは断定できない).');
          lines.push('');
          for (const id of gap.extraTcIds) lines.push(`- ${id}`);
          lines.push('');
        }
        continue;
      }
      if (gap.missingTcIds.length > 0) {
        lines.push('Missing TC IDs (spec にあるが test にない).');
        lines.push('');
        for (const id of gap.missingTcIds) lines.push(`- ${id}`);
        lines.push('');
      }
      if (gap.extraTcIds.length > 0) {
        lines.push('Extra TC IDs (test にあるが spec にない).');
        lines.push('');
        for (const id of gap.extraTcIds) lines.push(`- ${id}`);
        lines.push('');
      }
      if (gap.missingTcIds.length === 0 && gap.extraTcIds.length === 0) {
        // ここへ来るのは case を 1 件以上読めた時だけ (0 件は上で return 済)。
        // 件数を添えるのは、 何件に対する一致かが本文から読めるようにするため。
        lines.push(`spec と test が完全に一致 (spec の case ${gap.specCaseCount} 件).`);
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}
