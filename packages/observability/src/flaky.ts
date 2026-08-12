import type { FlakyTest, RunHistory } from './types.js';

/**
 * flaky と判定する前に要求する最小 run 数。
 *
 * 検出と表示の両方がこの値を見る。 片方だけ変えると「判定した」 と「判定して
 * いない」 の表示が実際の判定とずれる。
 */
export const DEFAULT_FLAKY_MIN_RUNS = 3;

export interface DetectFlakyOptions {
  history: RunHistory;
  /** Minimum number of runs before a test is eligible for flaky scoring */
  minRuns?: number;
  /** Failure rate threshold; tests with 0 < rate < 1 are flaky; tests above this are reported */
  threshold?: number;
}

interface RunTally {
  fullName: string;
  passes: number;
  failures: number;
  totalRuns: number;
}

/**
 * testId ごとの run 数を数える。
 *
 * `skipped` は数えない = 走っていないので pass / fail の材料にならない。
 */
function tally(history: RunHistory): Map<string, RunTally> {
  const byId = new Map<string, RunTally>();
  for (const rec of history.records) {
    if (rec.status === 'skipped') continue;
    const entry = byId.get(rec.testId) ?? {
      fullName: rec.fullName,
      passes: 0,
      failures: 0,
      totalRuns: 0,
    };
    entry.totalRuns += 1;
    if (rec.status === 'passed') entry.passes += 1;
    if (rec.status === 'failed') entry.failures += 1;
    byId.set(rec.testId, entry);
  }
  return byId;
}

export interface FlakyEligibility {
  /** `minRuns` に届いた testId の数。 0 なら 1 件も判定していない。 */
  eligible: number;
  /** 1 つの testId が持つ最大 run 数。 判定できない理由を示すために出す。 */
  maxRuns: number;
  /** 判定に要求した run 数。 */
  minRuns: number;
}

/**
 * flaky を判定できる材料があるかを返す。
 *
 * **「flaky が無い」 と「flaky を判定していない」 は別**。 `detectFlaky` は
 * `minRuns` に届かない test を黙って飛ばすため、 1 回しか走っていない history では
 * 常に空を返す。 空を「無い」 と読むと、 走らせていない状態と、 走らせて安定して
 * いる状態が同じ表示になる (#1909)。
 *
 * 判定と同じ数え方をここで共有する = 数え方が 2 箇所に分かれると、 表示だけが
 * 実際の判定とずれる。
 */
export function flakyEligibility(opts: { history: RunHistory; minRuns?: number }): FlakyEligibility {
  const minRuns = opts.minRuns ?? DEFAULT_FLAKY_MIN_RUNS;
  const byId = tally(opts.history);
  let eligible = 0;
  let maxRuns = 0;
  for (const entry of byId.values()) {
    if (entry.totalRuns >= minRuns) eligible += 1;
    if (entry.totalRuns > maxRuns) maxRuns = entry.totalRuns;
  }
  return { eligible, maxRuns, minRuns };
}

export function detectFlaky(opts: DetectFlakyOptions): FlakyTest[] {
  const minRuns = opts.minRuns ?? DEFAULT_FLAKY_MIN_RUNS;
  const threshold = opts.threshold ?? 0.1;
  const byId = tally(opts.history);
  const out: FlakyTest[] = [];
  for (const [testId, entry] of byId) {
    if (entry.totalRuns < minRuns) continue;
    if (entry.passes === entry.totalRuns) continue;
    if (entry.failures === entry.totalRuns) continue;
    const failureRate = entry.failures / entry.totalRuns;
    if (failureRate < threshold) continue;
    out.push({
      testId,
      fullName: entry.fullName,
      totalRuns: entry.totalRuns,
      passes: entry.passes,
      failures: entry.failures,
      failureRate,
    });
  }
  out.sort((a, b) => b.failureRate - a.failureRate);
  return out;
}
