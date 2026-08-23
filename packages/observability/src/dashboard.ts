import { flakyEligibility } from './flaky.js';
import { analyzeSlowest } from './slowest.js';
import type { DashboardInput } from './types.js';

function summarize(input: DashboardInput): {
  totalRecords: number;
  passes: number;
  failures: number;
  skipped: number;
  /** pass / fail の record が 1 件も無ければ null = 計算していない。 */
  passRate: number | null;
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
    // 分母が 0 の時に 1 を返さない。 record 0 件 (runner が繋がっていない) と、
    // skip しか無い run と、 全部通った run が同じ `100.0%` になっていた (#1909)。
    passRate: denom > 0 ? passes / denom : null,
  };
}

/** ms を読める単位にする。 1 秒未満は ms、それ以上は秒。 */
function formatMs(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

/**
 * 差を「向き付きの絶対値 + 比」 で書く。
 *
 * 比が出せない場合 (比較対象なし / 前 run が 0ms) は絶対値だけを書く。 `Infinity` や
 * `NaN` を表示に出さない。
 */
function formatDelta(deltaMs: number | null, deltaRatio: number | null): string {
  if (deltaMs === null) return 'n/a (比較対象なし)';
  const sign = deltaMs > 0 ? '+' : deltaMs < 0 ? '-' : '±';
  const abs = formatMs(Math.abs(deltaMs));
  if (deltaRatio === null) return `${sign}${abs} (比は出せない: 前 run が 0ms)`;
  return `${sign}${abs} (${deltaRatio > 0 ? '+' : ''}${(deltaRatio * 100).toFixed(1)}%)`;
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
  lines.push(
    `| pass rate | ${summary.passRate === null ? 'n/a' : `${(summary.passRate * 100).toFixed(1)}%`} |`,
  );
  lines.push('');
  if (summary.passRate === null) {
    lines.push(
      summary.totalRecords === 0
        ? 'test の実行結果を 1 件も受け取っていない。 この run で何が通ったかは判定していない.'
        : 'pass / fail の record が無い (skip のみ)。 pass rate は計算していない.',
    );
    lines.push('');
  }

  lines.push('## Flaky tests');
  lines.push('');
  // **渡された検出結果が優先される**。 eligibility はこちらで導き直す推定なので、
  // 呼出側が `detectFlaky` に別の `minRuns` を渡していると食い違う。 推定を先に見ると
  // **実際に検出した flaky を隠す** (`minRuns: 2` で検出した test が、 既定 3 の
  // 再判定で「判定していない」 に化けた。 Round 1 F1、 実 consumer で再現)。
  //
  // 検出結果が空の時だけ、 それが「判定した上で 0 件」 か「判定していない」 かを
  // eligibility で分ける。
  const eligibility = flakyEligibility({
    history: input.flakyHistory ?? input.history,
    ...(input.flakyMinRuns === undefined ? {} : { minRuns: input.flakyMinRuns }),
  });
  if (input.flakyHistory && input.flakyHistory !== input.history) {
    // Summary は この run、 flaky は累積を見る。 期間が違うことを書かないと、 Summary の
    // 件数と flaky の run 数が食い違って見える (#1918 Round 2 F3)。
    lines.push(
      `判定は累積 ${input.flakyHistory.records.length} record に対して行う (Summary はこの run)。`,
    );
    lines.push('');
  }
  if (input.flaky.length === 0 && eligibility.eligible === 0) {
    // **「flaky が無い」 と書かない**。 `detectFlaky` は minRuns に届かない test を
    // 飛ばすので、 1 回しか走っていない history では必ず空になる。 空を「無い」 と
    // 読むと、 判定できていない状態が「安定している」 と読まれる (#1909)。
    lines.push(
      `flaky は判定していない。 判定には同じ test の run が ${eligibility.minRuns} 回要るが、 最大 ${eligibility.maxRuns} 回しか無い.`,
    );
  } else if (input.flaky.length === 0) {
    lines.push(`No flaky tests detected. (${eligibility.eligible} test を判定)`);
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

  lines.push('## Execution time');
  lines.push('');
  // 集めている `durationMs` を出す。 遅い test がどれかを見る経路が他に無い (#2186)。
  const timing = analyzeSlowest({
    history: input.history,
    ...(input.slowestLimit === undefined ? {} : { limit: input.slowestLimit }),
    ...(input.flakyHistory === undefined ? {} : { cumulative: input.flakyHistory }),
  });
  lines.push('| metric | value |');
  lines.push('|---|---|');
  lines.push(`| total | ${formatMs(timing.totalMs)} |`);
  lines.push(`| measured records | ${timing.measured} |`);
  lines.push(`| unmeasured records | ${timing.unmeasured} |`);
  lines.push(
    `| previous run total | ${timing.previousTotalMs === null ? 'n/a (比較対象なし)' : formatMs(timing.previousTotalMs)} |`,
  );
  lines.push(`| delta | ${formatDelta(timing.deltaMs, timing.deltaRatio)} |`);
  lines.push('');
  if (timing.measured === 0) {
    // **「速い」 と書かない**。 duration を出さない reporter 設定では全 record が 0 になり、
    // 合計 0ms は「速い」 ではなく「測っていない」 を意味する。
    lines.push(
      input.history.records.length === 0
        ? 'test の実行結果を 1 件も受け取っていない。 実行時間は測っていない.'
        : 'duration を持つ record が 1 件も無い。 reporter が実行時間を出していない可能性がある.',
    );
    lines.push('');
  } else {
    lines.push(`| testId | duration | name |`);
    lines.push(`|---|---|---|`);
    for (const slow of timing.slowest) {
      lines.push(`| ${slow.testId} | ${formatMs(slow.durationMs)} | ${slow.fullName} |`);
    }
    lines.push('');
    if (timing.unmeasured > 0) {
      // 一覧が全件を覆っていないことを書く。 書かないと「上位 N がこの suite の遅い順」 と
      // 読まれるが、実際は測れた record の中の順序でしかない。
      lines.push(
        `duration を持たない record が ${timing.unmeasured} 件ある。 上位は測れた ${timing.measured} 件の中の順序.`,
      );
      lines.push('');
    }
  }

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
