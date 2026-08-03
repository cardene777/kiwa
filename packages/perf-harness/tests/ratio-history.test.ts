import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { buildMeasureResult, captureEnv, loadBaseline, runPerf3Layer } from '../src/index.js';
import {
  INTER_RUN_SPREAD_MULTIPLE,
  MAX_RATIO_HISTORY,
  MIN_RATIO_HISTORY,
  detectRegression,
  interRunRelativeSpread,
  observedRatio,
} from '../src/regression.js';
import { applyRatioHistory, resolvePendingRatio } from '../src/baseline-write.js';
import type { MeasureResult } from '../src/types.js';

/**
 * #1739 — op 個別の実行間ばらつきで回帰判定が入れ替わる問題。
 *
 * 実行内正規化 (#1737) は実行全体に乗るずれを消したが、 op 個別のばらつきは基準 op と
 * 邪魔を共有しないため残る。 判定に使う bootstrap CI は 1 回の実行の中の標本から作るので
 * このばらつきを含まず、 実装を変えずに測るだけで 22-29 package が落ちていた。
 *
 * baseline に「対象 p10 ÷ 基準 p10」 の履歴を積み、 その幅を超えた差だけを有意とする。
 */

const created: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(os.tmpdir(), 'perf-harness-hist-'));
  created.push(dir);
  return dir;
}

/** baseline に残った履歴と預かりを 1 つの形で読む。 */
function recordState(dir: string, key = 'alpha.serial') {
  const results = JSON.parse(readFileSync(join(dir, 'baseline.json'), 'utf8')).results as Record<
    string,
    MeasureResult
  >;
  const record = results[key];
  return {
    history: record?.ratioHistory ?? [],
    pendingRatio: record?.pendingRatio,
    pendingVerdict: record?.pendingVerdict,
    pendingSustained: record?.pendingSustained,
  };
}

/**
 * 「その実行の判定なら記録がこう動く」 を確かめる。
 *
 * 判定そのものは実測なので、 machine の負荷で `stable` と `regressed` が入れ替わる。
 * 入れ替わっても振り分けの規則は変わらないため、 判定を観測してから対応する規則を
 * 見る。 判定を固定値として書くと test が負荷に依存して落ちる (#1770 で実測)。
 */
function expectRoutedBy(
  verdict: string,
  before: ReturnType<typeof recordState>,
  after: ReturnType<typeof recordState>,
): void {
  /**
   * 前回の預かりが今回の判定で履歴に移るなら 1、 捨てられる / 無いなら 0。
   *
   * 既に持続と判った預かり (`pendingSustained`) は方向が変わっても移らない。
   */
  const carried =
    before.pendingRatio !== undefined &&
    before.pendingVerdict !== verdict &&
    before.pendingSustained !== true
      ? 1
      : 0;
  const grew = (own: number) =>
    Math.min(before.history.length + carried + own, MAX_RATIO_HISTORY);

  if (verdict === 'stable') {
    // 幅の材料になる。 その場で積み、 預かりは残さない。
    expect(after.history).toHaveLength(grew(1));
    expect(after.pendingRatio).toBeUndefined();
    return;
  }
  if (verdict === 'regressed' || verdict === 'improved') {
    // 一度きりの跳ねか持続的なずれかは次の実行まで決まらない。 今回の比は預けるだけ。
    expect(after.pendingVerdict).toBe(verdict);
    expect(after.pendingRatio).toBeDefined();
    // 同じ方向が続いた = 持続的なずれで前回の預かりは捨てる (carried 0)。
    // 方向が変わった = 一度きりの跳ねで前回の預かりだけが履歴に移る (carried 1)。
    expect(after.history).toHaveLength(grew(0));
    return;
  }
  // 比較が成立しなかった実行 (seed / 測定条件の変更) は記録を入れ替える。
  expect(after.history.length).toBeGreaterThanOrEqual(1);
}

afterEach(() => {
  while (created.length > 0) {
    const dir = created.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

/** 基準 op つきの記録を組み立てる。 比 = p10 / reference.p10 になる。 */
function withReference(samples: number[], referenceP10: number, history?: number[]): MeasureResult {
  const base = buildMeasureResult('op.serial', samples.length, 0, samples);
  return {
    ...base,
    reference: { kind: 'cpu', name: 'harness.reference.cpu', p10: referenceP10, implVersion: 1 },
    ...(history === undefined ? {} : { ratioHistory: history }),
  };
}

describe('observedRatio — この実行で観測した比 (#1739)', () => {
  it('対象 p10 を基準 p10 で割った値を返す', () => {
    const result = withReference([2, 2, 2], 4);
    expect(observedRatio(result)).toBeCloseTo(0.5, 10);
  });

  it('基準が無ければ求まらない', () => {
    expect(observedRatio(buildMeasureResult('op', 3, 0, [1, 1, 1]))).toBeNull();
  });

  it('基準が分母にならない値なら求まらない', () => {
    // 0 で割ると Infinity になり、 幅の推定が壊れる。
    expect(observedRatio(withReference([1, 1, 1], 0))).toBeNull();
  });
});

describe('interRunRelativeSpread — 実行間のばらつきの推定 (#1739)', () => {
  it(`履歴が ${MIN_RATIO_HISTORY} 件に満たなければ推定しない`, () => {
    // 2 点では幅の推定が 1 つの差にそのまま引きずられる。
    expect(interRunRelativeSpread([1.0, 1.2], 1.0)).toBeNull();
    expect(interRunRelativeSpread(undefined, 1.0)).toBeNull();
  });

  it('anchor から最も離れた点の相対距離を返す', () => {
    // anchor = 1.0、 履歴の最遠は 1.3 → 30%。
    expect(interRunRelativeSpread([0.9, 1.1, 1.3], 1.0)).toBeCloseTo(0.3, 10);
  });

  it('基準は履歴の中心ではなく anchor', () => {
    // 履歴自身はきれいに揃っているが、 anchor からは全て 50% 離れている。
    // 中央値まわりの散らばりで測ると 0% になり、 幅がまったく効かない。
    // 判定量は anchor との比なので、 ここは 50% でなければならない。
    expect(interRunRelativeSpread([1.5, 1.5, 1.5], 1.0)).toBeCloseTo(0.5, 10);
  });

  it('anchor と一致する履歴では 0 になる', () => {
    expect(interRunRelativeSpread([1, 1, 1, 1], 1)).toBe(0);
  });

  it('anchor が分母にならなければ推定しない', () => {
    expect(interRunRelativeSpread([1, 1, 1], 0)).toBeNull();
    expect(interRunRelativeSpread([1, 1, 1], Number.NaN)).toBeNull();
  });

  it('分母にならない値は数えない', () => {
    expect(interRunRelativeSpread([1, 1, Number.NaN], 1)).toBeNull();
    expect(interRunRelativeSpread([1, 1, -1], 1)).toBeNull();
  });
});

describe('detectRegression — 実行間のばらつきを有意性に使う (#1739)', () => {
  /** baseline の比 (= p10 ÷ 基準 p10)。 履歴はこの値を基準に組み立てる。 */
  const ANCHOR = 10 / 100;

  /** baseline を 1.0 前後、 今回を `ratio` 倍で作る。 差は明確に有意になる。 */
  function judge(currentScale: number, history?: number[]) {
    const baselineSamples = Array.from({ length: 40 }, (_, i) => 10 + (i % 3) * 0.01);
    const currentSamples = baselineSamples.map((v) => v * currentScale);
    return detectRegression({
      current: withReference(currentSamples, 100),
      baseline: withReference(baselineSamples, 100, history),
      threshold: 0.2,
    });
  }

  it('履歴が無ければ従来どおり相対閾値で判定する', () => {
    const result = judge(1.3);
    expect(result.interRunSpread).toBeUndefined();
    expect(result.effectiveThreshold).toBe(0.2);
    expect(result.verdict).toBe('regressed');
  });

  it('ばらつきの範囲に収まる差は stable に落とす', () => {
    // anchor から 25% 離れたことがある op。 2 倍して 50% が実効閾値になる。
    // 30% の差はその範囲なので、 その op の揺れと見分けが付かない。
    const history = [ANCHOR, ANCHOR * 1.25, ANCHOR * 0.9];
    const result = judge(1.3, history);
    expect(result.interRunSpread).toBeCloseTo(0.25, 6);
    expect(result.effectiveThreshold).toBeCloseTo(0.25 * INTER_RUN_SPREAD_MULTIPLE, 6);
    expect(result.verdict).toBe('stable');
    // 「変化が無い」 と「揺れと見分けが付かない」 を区別できる。
    expect(result.suppressedByInterRunSpread).toBe(true);
  });

  it('ばらつきを超える差は regressed のままになる', () => {
    const history = [ANCHOR, ANCHOR * 1.25, ANCHOR * 0.9];
    // 3 倍の遅延は実効閾値 50% を大きく超える。
    const result = judge(3, history);
    expect(result.verdict).toBe('regressed');
    expect(result.suppressedByInterRunSpread).toBe(false);
  });

  it('揺れの小さい op では相対閾値のほうが効く', () => {
    // 幅 1% の op。 2 倍しても 2% で、 相対閾値 20% を下回る。
    // 実効閾値が相対閾値を下回ると、 わずかな差で落ちるようになってしまう。
    const history = [ANCHOR, ANCHOR * 1.01, ANCHOR * 0.99];
    const result = judge(1.3, history);
    expect(result.effectiveThreshold).toBe(0.2);
    expect(result.verdict).toBe('regressed');
  });

  it('改善側にも同じ幅が効く', () => {
    const history = [ANCHOR, ANCHOR * 1.25, ANCHOR * 0.9];
    const result = judge(0.75, history);
    expect(result.verdict).toBe('stable');
    expect(result.suppressedByInterRunSpread).toBe(true);
  });
});

describe('applyRatioHistory — baseline への積み方 (#1739)', () => {
  const record = buildMeasureResult('op.serial', 3, 0, [1, 1, 1]);

  it('記録の測定値は動かさず履歴だけ積む', () => {
    const { results, changed } = applyRatioHistory(
      { 'op.serial': record },
      new Map([['op.serial', { ratio: 0.5 }]]),
      MAX_RATIO_HISTORY,
    );
    expect(changed).toBe(true);
    const next = results['op.serial']!;
    expect(next.ratioHistory).toEqual([0.5]);
    // 比較の基準が毎回入れ替わると回帰を検出できなくなる。
    expect(next.p10).toBe(record.p10);
    expect(next.samples).toEqual(record.samples);
  });

  it('古いものから捨てて上限に収める', () => {
    const full = { ...record, ratioHistory: Array.from({ length: MAX_RATIO_HISTORY }, () => 1) };
    const { results } = applyRatioHistory(
      { 'op.serial': full },
      new Map([['op.serial', { ratio: 9 }]]),
      MAX_RATIO_HISTORY,
    );
    const history = results['op.serial']!.ratioHistory!;
    expect(history).toHaveLength(MAX_RATIO_HISTORY);
    expect(history[history.length - 1]).toBe(9);
  });

  it('分母にならない比は積まない', () => {
    const { changed } = applyRatioHistory(
      { 'op.serial': record },
      new Map([['op.serial', { ratio: Number.NaN }]]),
      MAX_RATIO_HISTORY,
    );
    expect(changed).toBe(false);
  });

  it('記録の無い key は無視する', () => {
    const { changed } = applyRatioHistory(
      { 'op.serial': record },
      new Map([['absent.serial', { ratio: 1 }]]),
      MAX_RATIO_HISTORY,
    );
    expect(changed).toBe(false);
  });

  it('中身が変わらなければ書き換えない', () => {
    // 同じ内容で書き直すと baseline の mtime だけが動き、 いつの測定値かが追えない。
    const { changed } = applyRatioHistory({ 'op.serial': record }, new Map(), MAX_RATIO_HISTORY);
    expect(changed).toBe(false);
  });
});

describe('退行した実行の比は履歴に積まない (#1739 review)', () => {
  it('退行を積むと次回その退行が stable になるため積まない', () => {
    // 実測 = anchor の 2 倍へ悪化した op の比を積むと幅が 100% になり、
    // 実効閾値 200% で同じ 100% の悪化が収まってしまう。
    const anchor = 1.0;
    const stableHistory = [1.0, 0.98, 1.02];
    const withRegression = [...stableHistory, 2.0];

    expect(interRunRelativeSpread(stableHistory, anchor)! * INTER_RUN_SPREAD_MULTIPLE).toBeLessThan(
      1.0,
    );
    // 積んでしまうと 100% の悪化が実効閾値の内側に入る。
    expect(
      interRunRelativeSpread(withRegression, anchor)! * INTER_RUN_SPREAD_MULTIPLE,
    ).toBeGreaterThan(1.0);
  });

  it('同じ退行を繰り返しても regressed のままになる', async () => {
    const dir = tempDir();
    let slow = false;
    const input = (run: number) => ({
      moduleName: 'reg',
      ops: [
        {
          name: 'alpha',
          fn: () => {
            // 10 倍。 3 倍だと suite を並列で回した時の測定のばらつきに埋もれて
            // 判定が入れ替わる (#1770 で実測)。 ここで見たいのは幅が広がるか否かで、
            // 判定が境界に乗るかどうかではない。
            let t = 0;
            const n = slow ? 200_000 : 20_000;
            for (let i = 0; i < n; i += 1) t += Math.sqrt(i);
            if (t < 0) throw new Error('unreachable');
          },
          serialP95CapMs: 1000,
        },
      ],
      reportPath: join(dir, `${run}.md`),
      baselinePath: join(dir, 'baseline.json'),
      serialIterations: 12,
      serialWarmup: 2,
      concurrency: 2,
      iterationsPerWorker: 2,
      memoryIterations: 5,
    });

    // 幅が推定できるまで同じ実装で回す。
    for (const run of [1, 2, 3, 4]) await runPerf3Layer(input(run));
    // 3 倍の負荷に切り替える。
    slow = true;
    const first = await runPerf3Layer(input(5));
    expect(first.outcomes[0]!.regressionVerdict).toBe('regressed');
    const afterFirst = recordState(dir);
    // 退行した比はその場では積まない。 預けるだけ。
    expect(afterFirst.pendingVerdict).toBe('regressed');

    const second = await runPerf3Layer(input(6));
    // 同じ方向が 2 回続いた = 持続的なずれ。 預かりを捨てるので幅は広がらず、
    // 判定は regressed のまま。 積んでいれば幅が広がって stable に化ける。
    expect(second.outcomes[0]!.regressionVerdict).toBe('regressed');
    expect(second.outcomes[0]!.sustainedRegression).toBe(true);
    expect(recordState(dir).history).toEqual(afterFirst.history);
  });
});

describe('resolvePendingRatio — 一度きりの跳ねと持続的なずれを分ける (#1770)', () => {
  it('同じ方向が続いたら持続的なずれとして捨てる', () => {
    // 積むと幅が広がり、 同じずれが次回 stable として通る。
    expect(resolvePendingRatio(1.3, 'regressed', 'regressed')).toEqual({ sustained: true });
    expect(resolvePendingRatio(0.7, 'improved', 'improved')).toEqual({ sustained: true });
  });

  it('方向が変わったら一度きりの跳ねとして履歴に移す', () => {
    // ここで捨てると、 その op が実際に見せた振れ幅が推定から抜け落ちる。
    expect(resolvePendingRatio(1.3, 'regressed', 'stable')).toEqual({
      commit: 1.3,
      sustained: false,
    });
    expect(resolvePendingRatio(1.3, 'regressed', 'improved')).toEqual({
      commit: 1.3,
      sustained: false,
    });
  });

  it('今回比較しなかった実行でも預かりは解決する', () => {
    // 比較できなかったことは「続かなかった」 であって「続いた」 ではない。
    expect(resolvePendingRatio(1.3, 'regressed', undefined)).toEqual({
      commit: 1.3,
      sustained: false,
    });
  });

  it('持続と判った預かりは、後で方向が変わっても履歴に移さない (#1770 review)', () => {
    // 移すと gate を落とした当の値が幅を広げ、 同じ規模の退行が次回 stable になる。
    expect(resolvePendingRatio(2.1, 'regressed', 'stable', true)).toEqual({ sustained: false });
    expect(resolvePendingRatio(2.1, 'regressed', 'improved', true)).toEqual({ sustained: false });
    expect(resolvePendingRatio(2.1, 'regressed', undefined, true)).toEqual({ sustained: false });
    // 持続が続いている間は従来どおり gate を落とし続ける。
    expect(resolvePendingRatio(2.1, 'regressed', 'regressed', true)).toEqual({ sustained: true });
  });

  it('預かりが無ければ何も起きない', () => {
    expect(resolvePendingRatio(undefined, undefined, 'regressed')).toEqual({ sustained: false });
    expect(resolvePendingRatio(1.3, undefined, 'regressed')).toEqual({ sustained: false });
  });
});

describe('applyRatioHistory — 1 実行遅らせて積む (#1770)', () => {
  const record = buildMeasureResult('op.serial', 3, 0, [1, 1, 1]);

  it('退行した実行の比はその場で積まず預ける', () => {
    const { results } = applyRatioHistory(
      { 'op.serial': record },
      new Map([['op.serial', { ratio: 1.3, verdict: 'regressed' as const }]]),
      MAX_RATIO_HISTORY,
    );
    const next = results['op.serial']!;
    expect(next.ratioHistory ?? []).toEqual([]);
    expect(next.pendingRatio).toBe(1.3);
    expect(next.pendingVerdict).toBe('regressed');
  });

  it('続かなかった預かりは次の実行で履歴に移る', () => {
    const held = { ...record, pendingRatio: 1.3, pendingVerdict: 'regressed' as const };
    const { results } = applyRatioHistory(
      { 'op.serial': held },
      new Map([['op.serial', { ratio: 1.0, verdict: 'stable' as const }]]),
      MAX_RATIO_HISTORY,
    );
    const next = results['op.serial']!;
    // 跳ねた 1.3 と、 今回の 1.0 の両方が入る。 1.3 を捨てると幅が過小に出る。
    expect(next.ratioHistory).toEqual([1.3, 1.0]);
    expect(next.pendingRatio).toBeUndefined();
    expect(next.pendingVerdict).toBeUndefined();
  });

  it('続いた預かりは捨てて、今回の比を預け直す', () => {
    const held = { ...record, pendingRatio: 1.3, pendingVerdict: 'regressed' as const };
    const { results } = applyRatioHistory(
      { 'op.serial': held },
      new Map([['op.serial', { ratio: 1.35, verdict: 'regressed' as const }]]),
      MAX_RATIO_HISTORY,
    );
    const next = results['op.serial']!;
    // 持続的なずれは幅に入れない。 入れると同じずれが次回 stable として通る。
    expect(next.ratioHistory ?? []).toEqual([]);
    expect(next.pendingRatio).toBe(1.35);
    expect(next.pendingVerdict).toBe('regressed');
  });

  it('比較しなかった実行の比はその場で積む', () => {
    // 打ち消す相手がいないので預ける意味がない。
    const { results } = applyRatioHistory(
      { 'op.serial': record },
      new Map([['op.serial', { ratio: 0.5 }]]),
      MAX_RATIO_HISTORY,
    );
    const next = results['op.serial']!;
    expect(next.ratioHistory).toEqual([0.5]);
    expect(next.pendingRatio).toBeUndefined();
  });

  it('続いた預かりに印を付け、方向が変わっても履歴に移さない (#1770 review)', () => {
    // regressed → regressed → stable の 3 実行を通す。
    const held = { ...record, pendingRatio: 2.0, pendingVerdict: 'regressed' as const };
    const second = applyRatioHistory(
      { 'op.serial': held },
      new Map([['op.serial', { ratio: 2.1, verdict: 'regressed' as const }]]),
      MAX_RATIO_HISTORY,
    ).results['op.serial']!;
    // 2 回続いた時点で印が付く。
    expect(second.pendingSustained).toBe(true);
    expect(second.pendingRatio).toBe(2.1);

    const third = applyRatioHistory(
      { 'op.serial': second },
      new Map([['op.serial', { ratio: 1.0, verdict: 'stable' as const }]]),
      MAX_RATIO_HISTORY,
    ).results['op.serial']!;
    // 2.1 は gate を落とした当の値。 積むと幅が 110% に開き、 同じ退行が次回通る。
    expect(third.ratioHistory).toEqual([1.0]);
    expect(third.pendingRatio).toBeUndefined();
    expect(third.pendingSustained).toBeUndefined();
  });

  it('1 回だけの跳ねには印を付けない (#1770 review)', () => {
    const { results } = applyRatioHistory(
      { 'op.serial': record },
      new Map([['op.serial', { ratio: 1.3, verdict: 'regressed' as const }]]),
      MAX_RATIO_HISTORY,
    );
    // 印が付くのは「続いた」 時だけ。 初回に付けると跳ねが永久に積まれなくなる。
    expect(results['op.serial']!.pendingSustained).toBeUndefined();
  });

  it('比を作れなかった実行でも預かりは解決する (#1770 review)', () => {
    // 指示ごと出さないと預かりが残り続け、 何実行も後の regressed が
    // 「2 回連続」 になる。
    const held = { ...record, pendingRatio: 1.3, pendingVerdict: 'regressed' as const };
    const { results } = applyRatioHistory(
      { 'op.serial': held },
      new Map([['op.serial', { verdict: 'stable' as const }]]),
      MAX_RATIO_HISTORY,
    );
    const next = results['op.serial']!;
    // 積む値は無いが、 預かりは解決して履歴に移る。
    expect(next.ratioHistory).toEqual([1.3]);
    expect(next.pendingRatio).toBeUndefined();
    expect(next.pendingVerdict).toBeUndefined();
  });

  it('比を作れず判定も付かない実行は預かりを解決して鎖を切る (#1770 review)', () => {
    const held = { ...record, pendingRatio: 1.3, pendingVerdict: 'regressed' as const };
    const { results } = applyRatioHistory(
      { 'op.serial': held },
      new Map([['op.serial', {}]]),
      MAX_RATIO_HISTORY,
    );
    const next = results['op.serial']!;
    expect(next.ratioHistory).toEqual([1.3]);
    expect(next.pendingVerdict).toBeUndefined();
  });

  it('比を作れなかった退行の実行は預からない (#1770 review)', () => {
    // 預ける値が無いので続きを主張できない。 鎖を切る側に倒す。
    const { results } = applyRatioHistory(
      { 'op.serial': record },
      new Map([['op.serial', { verdict: 'regressed' as const }]]),
      MAX_RATIO_HISTORY,
    );
    const next = results['op.serial']!;
    expect(next.pendingRatio).toBeUndefined();
    expect(next.pendingVerdict).toBeUndefined();
  });
});

describe('runPerf3Layer — op 名の重複を測る前に止める (#1770 review)', () => {
  it('同名の op があれば例外にする', async () => {
    const dir = tempDir();
    // baseline の key は op 名で引くため、 重複すると記録と履歴が混ざる。
    await expect(
      runPerf3Layer({
        moduleName: 'dup',
        ops: [
          { name: 'alpha', fn: () => {}, serialP95CapMs: 1000 },
          { name: 'alpha', fn: () => {}, serialP95CapMs: 1000 },
        ],
        reportPath: join(dir, 'r.md'),
        baselinePath: join(dir, 'baseline.json'),
        serialIterations: 5,
        serialWarmup: 1,
        concurrency: 2,
        iterationsPerWorker: 2,
        memoryIterations: 5,
      }),
    ).rejects.toThrow(/op 名が重複/);
    // 測る前に止めるので baseline は作られない。
    expect(existsSync(join(dir, 'baseline.json'))).toBe(false);
  });
});

describe('runPerf3Layer — 実行を重ねると履歴が積まれる (#1739)', () => {
  /** 測定系の分解能より十分に長い workload。 比が安定して求まる。 */
  function busy(): void {
    let total = 0;
    for (let i = 0; i < 20_000; i += 1) total += Math.sqrt(i);
    if (total < 0) throw new Error('unreachable');
  }

  function input(dir: string, run: number) {
    return {
      moduleName: 'hist',
      ops: [{ name: 'alpha', fn: busy, serialP95CapMs: 1000 }],
      reportPath: join(dir, `${run}.md`),
      baselinePath: join(dir, 'baseline.json'),
      serialIterations: 12,
      serialWarmup: 2,
      concurrency: 2,
      iterationsPerWorker: 2,
      memoryIterations: 5,
    };
  }

  function history(dir: string): number[] | undefined {
    const results = JSON.parse(readFileSync(join(dir, 'baseline.json'), 'utf8')).results as Record<
      string,
      MeasureResult
    >;
    return results['alpha.serial']?.ratioHistory;
  }

  it('実行のたびに 1 件ずつ、判定に応じて履歴か預かりに入る', async () => {
    const dir = tempDir();
    // 1 回目は比較対象がない。 比はそのまま積まれる。
    await runPerf3Layer(input(dir, 1));
    expect(history(dir)).toHaveLength(1);

    // 2 回目以降は判定ごとに行き先が決まる。 これが本体の規則。
    //
    // 「n 回測れば幅を推定できる」 はここでは見ない。 machine の状態が実行の途中で
    // 変わると anchor から一方向にずれ続け、 その間は履歴が伸びないのが正しい挙動
    // だから (幅を広げると同じずれが次回 stable として通る)。 何回で揃うかは環境に
    // 依存する。 揃った後に幅が効くことは次の test が見る。
    for (const run of [2, 3, 4, 5]) {
      const before = recordState(dir);
      const result = await runPerf3Layer(input(dir, run));
      expectRoutedBy(result.outcomes[0]!.regressionVerdict, before, recordState(dir));
    }
  });

  it('履歴が揃うと幅を推定できる', async () => {
    // 実測を重ねる形だと machine の状態次第で履歴が伸びないので、 揃った状態を
    // 直接作って幅が求まることだけを見る。
    const filled = [1.0, 0.97, 1.04];
    expect(filled.length).toBeGreaterThanOrEqual(MIN_RATIO_HISTORY);
    expect(interRunRelativeSpread(filled, filled[0]!)).not.toBeNull();
    // 2 件では求まらない。
    expect(interRunRelativeSpread(filled.slice(0, 2), filled[0]!)).toBeNull();
  });

  it('履歴が揃った次の実行で幅が判定に効き、report にも出る', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'baseline.json');
    await runPerf3Layer(input(dir, 1));

    // 履歴を直接揃える。 実測を重ねて揃えると、 machine の状態が変わった時に
    // 履歴が伸びず (それが正しい挙動)、 幅と無関係な理由で落ちる。
    const seeded = JSON.parse(readFileSync(baselinePath, 'utf8')) as {
      results: Record<string, MeasureResult>;
    };
    const record = seeded.results['alpha.serial']!;
    const anchor = record.ratioHistory![0]!;
    record.ratioHistory = [anchor, anchor * 0.97, anchor * 1.04];
    writeFileSync(baselinePath, JSON.stringify(seeded));

    const next = await runPerf3Layer(input(dir, 2));
    // 幅を推定できた op は report に「実行間のばらつき」 が出る。
    expect(next.outcomes[0]!.regression?.interRunSpread).toBeDefined();
    expect(readFileSync(join(dir, '2.md'), 'utf8')).toContain('実行間のばらつき');
  });
});

describe('壊れた履歴を読まない (#1739 review)', () => {
  it('配列でない履歴を持つ記録は読めない記録として扱う', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'baseline.json');
    // baseline は file なので壊れた形が入り得る。 そのまま通すと幅を推定する側が
    // `.filter` を呼んだ時点で例外になり、 seed し直す経路に乗らず suite が止まる。
    const seeded = buildMeasureResult('alpha.serial', 4, 0, [1, 1, 1, 1]);
    writeFileSync(
      baselinePath,
      JSON.stringify({
        schema: 2,
        env: captureEnv(),
        results: { 'alpha.serial': { ...seeded, ratioHistory: {} } },
      }),
      'utf8',
    );

    // 例外にならず、記録が無い扱いで seed し直される。
    const result = await runPerf3Layer({
      moduleName: 'broken',
      ops: [{ name: 'alpha', fn: () => {}, serialP95CapMs: 1000 }],
      reportPath: join(dir, 'r.md'),
      baselinePath,
      serialIterations: 5,
      serialWarmup: 1,
      concurrency: 2,
      iterationsPerWorker: 2,
      memoryIterations: 5,
    });
    expect(result.baselineSeeded).toBe(true);
  });

  it.each([
    ['比が数でない', { pendingRatio: '1.3', pendingVerdict: 'regressed' }],
    ['比が 0 以下', { pendingRatio: 0, pendingVerdict: 'regressed' }],
    ['方向が想定外の文字列', { pendingRatio: 1.3, pendingVerdict: 'slower' }],
    ['比だけあって方向が無い', { pendingRatio: 1.3 }],
    ['方向だけあって比が無い', { pendingVerdict: 'regressed' }],
  ])('壊れた預かりを持つ記録は読めない記録として扱う — %s (#1770)', async (_label, broken) => {
    const dir = tempDir();
    const baselinePath = join(dir, 'baseline.json');
    // 預かりは次の実行で履歴に移る。 壊れた値を通すと幅の推定が NaN になり、
    // 比較が全て偽になって何倍悪化しても stable が出る。
    const seeded = buildMeasureResult('alpha.serial', 4, 0, [1, 1, 1, 1]);
    writeFileSync(
      baselinePath,
      JSON.stringify({
        schema: 2,
        env: captureEnv(),
        results: { 'alpha.serial': { ...seeded, ratioHistory: [1, 1, 1], ...broken } },
      }),
      'utf8',
    );

    const result = await runPerf3Layer({
      moduleName: 'broken-pending',
      ops: [{ name: 'alpha', fn: () => {}, serialP95CapMs: 1000 }],
      reportPath: join(dir, 'r.md'),
      baselinePath,
      serialIterations: 5,
      serialWarmup: 1,
      concurrency: 2,
      iterationsPerWorker: 2,
      memoryIterations: 5,
    });
    expect(result.baselineSeeded).toBe(true);
  });

  it('読み戻しで預かり 3 field が全て残る (#1770 review)', async () => {
    // 記録は読む時に sample から作り直される。 作り直しで運び忘れた field は
    // 読み戻すたびに黙って消える。 消えると持続的なずれが毎回 1 回目として扱われ、
    // gate が永久に落ちない。
    const dir = tempDir();
    const baselinePath = join(dir, 'baseline.json');
    const seeded = buildMeasureResult('alpha.serial', 4, 0, [1, 1, 1, 1]);
    writeFileSync(
      baselinePath,
      JSON.stringify({
        schema: 2,
        env: captureEnv(),
        results: {
          'alpha.serial': {
            ...seeded,
            ratioHistory: [1, 1, 1],
            pendingRatio: 2.1,
            pendingVerdict: 'regressed',
            pendingSustained: true,
          },
        },
      }),
      'utf8',
    );

    const loaded = await loadBaseline(baselinePath);
    const record = loaded!.envelope.results['alpha.serial']!;
    expect(record.pendingRatio).toBe(2.1);
    expect(record.pendingVerdict).toBe('regressed');
    expect(record.pendingSustained).toBe(true);
    expect(record.ratioHistory).toEqual([1, 1, 1]);
  });

  it('揃った預かりを持つ記録は読める (#1770)', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'baseline.json');
    const seeded = buildMeasureResult('alpha.serial', 4, 0, [1, 1, 1, 1]);
    writeFileSync(
      baselinePath,
      JSON.stringify({
        schema: 2,
        env: captureEnv(),
        results: {
          'alpha.serial': {
            ...seeded,
            ratioHistory: [1, 1, 1],
            pendingRatio: 1.3,
            pendingVerdict: 'regressed',
          },
        },
      }),
      'utf8',
    );

    const result = await runPerf3Layer({
      moduleName: 'valid-pending',
      ops: [{ name: 'alpha', fn: () => {}, serialP95CapMs: 1000 }],
      reportPath: join(dir, 'r.md'),
      baselinePath,
      serialIterations: 5,
      serialWarmup: 1,
      concurrency: 2,
      iterationsPerWorker: 2,
      memoryIterations: 5,
    });
    // 壊れていないので seed し直さない = 検査が正常な形まで弾いていないことの確認。
    expect(result.baselineSeeded).toBe(false);
  });
});
