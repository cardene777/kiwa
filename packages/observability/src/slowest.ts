import type { RunHistory, TestRunRecord } from './types.js';

/**
 * 遅い test 1 件。
 *
 * `durationMs` は **attempt の合計**。 `collect.ts` は retry した test の各 attempt を
 * 畳んで 1 record にするので、3 回 retry した test はその 3 回分を足した値になる。
 * 実時間より大きく出るのは仕様で、遅さの原因が retry である場合も同じ値に現れる。
 */
export interface SlowestTest {
  testId: string;
  fullName: string;
  durationMs: number;
  runId: string;
}

export interface SlowestAnalysis {
  /** 遅い順の上位。 `limit` 件まで。 測れた record が無ければ空。 */
  slowest: SlowestTest[];
  /** この run の合計。 測れなかった record は 0 として足す。 */
  totalMs: number;
  /** `durationMs` が 0 より大きい record 数。 */
  measured: number;
  /**
   * `durationMs` が 0 の record 数。
   *
   * **0 を「速い」 と読ませない**。 duration を出さない reporter 設定では全 record が 0 に
   * なり、上位 N が全部 0 で埋まる。 その状態と「本当に速い」 を区別する材料になる。
   */
  unmeasured: number;
  /**
   * 直前の run の合計。 **比較対象が無ければ `null`**。
   *
   * 0 に倒さない = 「前 run が 0ms だった」 と「前 run が無い」 は別物で、前者なら差は
   * 増加、後者は差そのものが存在しない。 潰すと初回の run が必ず「大幅に遅くなった」 と出る。
   */
  previousTotalMs: number | null;
  /** `totalMs - previousTotalMs`。 比較対象が無ければ `null`。 */
  deltaMs: number | null;
  /**
   * 増減の比 (`deltaMs / previousTotalMs`)。 比較対象が無い時と、前 run の合計が 0 の時は `null`。
   *
   * 前 run が 0 の時に `Infinity` を返さない = 表示する側が必ず特別扱いを要求されるため。
   */
  deltaRatio: number | null;
}

export interface AnalyzeSlowestOptions {
  /** この run の record。 */
  history: RunHistory;
  /** 上位何件を返すか。 既定 5。 0 以下と非整数は既定に倒す。 */
  limit?: number;
  /**
   * 累積 history。 直前の run を引くために使う。
   *
   * 渡さなければ比較しない (`previousTotalMs` が `null`)。 `history` と同じ物を渡した場合も、
   * この run 以外の run が無ければ比較対象は見つからない。
   */
  cumulative?: RunHistory;
}

const DEFAULT_LIMIT = 5;

/**
 * run ごとに record を束ね、開始時刻と **到着順** を添える。
 *
 * 到着順が要るのは、`startedAt` が同値になる形が実在するため。 `fromVitestJson` は
 * `report.startTime ?? 0` を入れるので、`startTime` を持たない report
 * (`kiwa-observe/SKILL.md` が明示的に扱う形、#1918) では **全 run が 0 になる**。
 *
 * 同値の時に開始時刻だけで選ぶと、`>` が先に来た方を残すので **最古の run** が
 * 「直前の run」 になる。 実測で 100ms → 900ms → 500ms の 3 run を実経路
 * (`fromVitestJson` → `collectRunHistory` → `renderDashboard`) に流すと、直前は 900ms
 * なのに 100ms が選ばれ、44% の短縮が **+400% の劣化**として出た (#2186 r1-f1)。
 *
 * 到着順は `collectRunHistory` が append する順序で、`startedAt` が全て同じでも
 * 前後関係を保つ。 順序を持たない history を直接渡した場合は前後関係そのものが無いので、
 * その時に何が「直前」 かは決められない。
 */
function groupByRun(
  records: readonly TestRunRecord[],
): Map<string, { startedAt: number; arrival: number; totalMs: number }> {
  const runs = new Map<string, { startedAt: number; arrival: number; totalMs: number }>();
  records.forEach((rec, index) => {
    const found = runs.get(rec.runId);
    if (found === undefined) {
      runs.set(rec.runId, {
        startedAt: rec.startedAt,
        arrival: index,
        totalMs: rec.durationMs > 0 ? rec.durationMs : 0,
      });
      return;
    }
    // 開始時刻は最小を採る。 record の順序は保証されていないので、先頭の値を使わない。
    if (rec.startedAt < found.startedAt) found.startedAt = rec.startedAt;
    // 到着順は最大を採る。 その run の record が最後に現れた位置が、その run の位置。
    if (index > found.arrival) found.arrival = index;
    // 比較対象も現在 run と同じ測定規約で集計する。負値を片側だけに入れると差が反転する。
    if (rec.durationMs > 0) found.totalMs += rec.durationMs;
  });
  return runs;
}

/**
 * 遅い test と、直前の run との差を出す。
 *
 * 集めている `durationMs` を使うだけで、新しい計測は行わない。
 */
export function analyzeSlowest(opts: AnalyzeSlowestOptions): SlowestAnalysis {
  const records = opts.history.records;
  const limit =
    opts.limit !== undefined && Number.isInteger(opts.limit) && opts.limit > 0
      ? opts.limit
      : DEFAULT_LIMIT;

  // **`> 0` でない record は合計にも入れない**。 判定と加算で扱いが割れていると、
  // 負の値を出す reporter で `total` が壊れた record が「測っていないだけ」 として報告される
  // (−500 と +100 で `total -400ms` / `measured 1` / `unmeasured 1` になっていた、#2186 r1-f3)。
  let totalMs = 0;
  let measured = 0;
  let unmeasured = 0;
  for (const rec of records) {
    if (rec.durationMs > 0) {
      totalMs += rec.durationMs;
      measured += 1;
    } else {
      unmeasured += 1;
    }
  }

  // 測れた record だけを並べる。 0 を混ぜると、duration を出さない reporter の時に
  // 上位が全部 0 で埋まり、「遅い test の一覧」 が意味を失う。
  // `filter` が新しい配列を返すので、`sort` は呼出側の配列を触らない。
  // 防御の `slice()` を挟んでいたが、変異試験で外しても 1 件も落ちなかった = 二重に
  // copy していただけだった。 呼出側を書き換えないことは T-SLW-012 が固定する。
  const slowest = records
    .filter((rec) => rec.durationMs > 0)
    .sort((a, b) => b.durationMs - a.durationMs || a.testId.localeCompare(b.testId))
    .slice(0, limit)
    .map((rec) => ({
      testId: rec.testId,
      fullName: rec.fullName,
      durationMs: rec.durationMs,
      runId: rec.runId,
    }));

  const thisRunIds = new Set(records.map((rec) => rec.runId));
  let previousTotalMs: number | null = null;
  if (opts.cumulative !== undefined) {
    // この run に含まれない runId のうち、最も新しく始まったものを直前の run とみなす。
    // `history` が複数 runId を持つ形 (vitest と Playwright を 1 run に束ねる経路) でも、
    // その全てを「この run」 として除く。
    let latest: { startedAt: number; arrival: number; totalMs: number } | null = null;
    for (const [runId, info] of groupByRun(opts.cumulative.records)) {
      if (thisRunIds.has(runId)) continue;
      if (latest === null) {
        latest = info;
        continue;
      }
      // 開始時刻が同値なら到着順で割る。 同値は `startTime` を持たない report で実際に起きる。
      const newer =
        info.startedAt !== latest.startedAt
          ? info.startedAt > latest.startedAt
          : info.arrival > latest.arrival;
      if (newer) latest = info;
    }
    if (latest !== null) previousTotalMs = latest.totalMs;
  }

  const deltaMs = previousTotalMs === null ? null : totalMs - previousTotalMs;
  const deltaRatio =
    previousTotalMs === null || previousTotalMs === 0 || deltaMs === null
      ? null
      : deltaMs / previousTotalMs;

  return { slowest, totalMs, measured, unmeasured, previousTotalMs, deltaMs, deltaRatio };
}
