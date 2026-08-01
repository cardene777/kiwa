import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { buildMeasureResult, captureEnv, runPerf3Layer } from '../src/index.js';
import {
  INTER_RUN_SPREAD_MULTIPLE,
  MAX_RATIO_HISTORY,
  MIN_RATIO_HISTORY,
  detectRegression,
  interRunRelativeSpread,
  observedRatio,
} from '../src/regression.js';
import { applyRatioHistory } from '../src/baseline-write.js';
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
            let t = 0;
            const n = slow ? 60_000 : 20_000;
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

    // 退行した比を積んでいれば、次回は幅が広がって stable に化ける。
    const second = await runPerf3Layer(input(6));
    expect(second.outcomes[0]!.regressionVerdict).toBe('regressed');
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

  it('実行のたびに 1 件ずつ積み上がる', async () => {
    const dir = tempDir();
    await runPerf3Layer(input(dir, 1));
    expect(history(dir)).toHaveLength(1);

    await runPerf3Layer(input(dir, 2));
    expect(history(dir)).toHaveLength(2);

    await runPerf3Layer(input(dir, 3));
    const third = history(dir)!;
    expect(third).toHaveLength(3);
    // 3 件揃うと幅を推定できる。
    expect(interRunRelativeSpread(third, third[0]!)).not.toBeNull();
  });

  it('4 回目の判定に幅が効き、report にも出る', async () => {
    const dir = tempDir();
    for (const run of [1, 2, 3]) await runPerf3Layer(input(dir, run));

    const fourth = await runPerf3Layer(input(dir, 4));
    const outcome = fourth.outcomes[0]!;
    // 幅を推定できた op は report に「実行間のばらつき」 が出る。
    expect(outcome.regression?.interRunSpread).toBeDefined();
    expect(readFileSync(join(dir, '4.md'), 'utf8')).toContain('実行間のばらつき');
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
});
