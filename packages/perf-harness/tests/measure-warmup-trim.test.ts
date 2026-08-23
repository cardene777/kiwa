import { describe, expect, it } from 'vitest';
import { buildMeasureResult, measure, measureAlternating, measureHarnessResolution } from '../src/index.js';

/**
 * convergent warmup と trim 統計は、 既定の経路 (fixed warmup / trimPercent = 0) では
 * 一度も通らない。 通らないまま置いておくと「収束しなかった実行」 と「trim 後の統計」 が
 * 壊れていても report まで出てしまうため、 両方に入口から入る検査を置く。
 *
 * 時間そのものは差し替えない。 収束判定は実測値の散らばりを読むので、 時計を止めると
 * 判定式に入る値が全て 0 になり検査の意味が消える。 代わりに windowSize と
 * maxIterations を小さくし、 収束するかどうかを toleranceRatio の側で決める。
 */

/** 計時が 0ns に潰れないだけの最小の仕事。 p95 > 0 の前提を満たすために置く。 */
function tinyWork(): void {
  let acc = 0;
  for (let i = 0; i < 500; i += 1) acc += i;
  if (acc < 0) throw new Error('unreachable');
}

describe('measure — convergent warmup (#1718)', () => {
  it('T-PH-M-009 許容幅が広ければ window が埋まった時点で収束して止まる', async () => {
    let calls = 0;
    const result = await measure({
      name: 'convergent-hit',
      iterations: 3,
      warmupStrategy: 'convergent',
      // toleranceRatio を実測の散らばりより十分大きく取ると、 window が
      // windowSize に達した最初の判定で必ず収束する = 収束経路が確実に通る。
      warmupConvergence: { windowSize: 3, toleranceRatio: 1_000, maxIterations: 50 },
      fn: () => {
        calls += 1;
        tinyWork();
      },
    });

    expect(result.warmupConverged).toBe(true);
    // 収束は window が埋まってから初めて判定されるので、 warmup は windowSize 以上。
    expect(result.warmup).toBeGreaterThanOrEqual(3);
    expect(result.warmup).toBeLessThan(50);
    // warmup の呼出も計測の呼出も同じ fn を通る。 捨て回しが実際に走ったことを
    // 呼出回数で確かめる (warmup を数えているだけで回していない、 を弾く)。
    expect(calls).toBe(result.warmup + 3);
  });

  it('T-PH-M-010 揺れ続ける workload は maxIterations で打ち切り converged=false を返す', async () => {
    // 許容幅は実際に使う値 (1%) のまま、 **workload 側を揺らす**。
    // 負の許容幅を渡すと条件が恒偽になり、 workload の性質に関わらず打ち切られるため
    // 「不安定さを検知して打ち切った」 ことの証明にならない。
    let call = 0;
    const result = await measure({
      name: 'convergent-miss',
      iterations: 2,
      warmupStrategy: 'convergent',
      // windowSize < maxIterations にして window の押し出し (shift) も通す。
      warmupConvergence: { windowSize: 3, toleranceRatio: 0.01, maxIterations: 6 },
      fn: () => {
        // 1 回おきに 200 倍の仕事をする。 window 内に必ず速い回と遅い回が同居するため
        // range / p95 は 1% を大きく超え続ける。
        call += 1;
        const reps = call % 2 === 0 ? 200 : 1;
        for (let r = 0; r < reps; r += 1) tinyWork();
      },
    });

    expect(result.warmupConverged, '揺れ続けるので収束しない').toBe(false);
    // 打ち切りは maxIterations ちょうど。 ここが maxIterations + 1 になると
    // 「収束した時の iterations + 1」 と同じ値を返しており両者を区別できない。
    expect(result.warmup).toBe(6);
  });

  it('T-PH-M-011a warmupConvergence 省略時は既定の設定 (window 20 / 上限 200) で回る', async () => {
    const result = await measure({
      name: 'convergent-default',
      iterations: 2,
      warmupStrategy: 'convergent',
      fn: () => {
        tinyWork();
      },
    });

    // 既定は window 20 / maxIterations 200。 収束するかは実測の散らばり次第なので
    // 真偽は問わず、 判定が始まる下限と打ち切りの上限の内側に収まることだけを見る。
    expect(result.warmup).toBeGreaterThanOrEqual(20);
    expect(result.warmup).toBeLessThanOrEqual(200);
    expect(typeof result.warmupConverged).toBe('boolean');
  });

  it('T-PH-M-011 fixed strategy は収束判定を通らず常に converged=true', async () => {
    const result = await measure({
      name: 'fixed-strategy',
      iterations: 2,
      warmup: 1,
      warmupStrategy: 'fixed',
      fn: () => {},
    });

    expect(result.warmupConverged).toBe(true);
    expect(result.warmup).toBe(1);
  });
});

describe('buildMeasureResult — trim 統計 (trimPercent > 0)', () => {
  it('T-PH-M-012 上下を trimPercent ずつ落として統計を取り直す', () => {
    // n = 10 / 10% → 上下 1 件ずつ落として 2..9 の 8 件が残る。
    const result = buildMeasureResult('trim-normal', 10, 0, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10);

    expect(result.trimmed).toBeDefined();
    expect(result.trimmed?.percent).toBe(10);
    expect(result.trimmed?.sampleCount).toBe(8);
    expect(result.trimmed?.mean).toBeCloseTo(5.5, 10);
    expect(result.trimmed?.p50).toBeCloseTo(5.5, 10);
    // 元の samples は trim しない (report が生の分布を出せなくなるため)。
    expect(result.samples).toHaveLength(10);
    // 外れ値を落とした側の方が散らばりが小さいことを、 生の stdev と比べて確かめる。
    expect(result.trimmed?.stdev).toBeLessThan(result.stdev);
  });

  it('T-PH-M-013 trim で 1 件だけ残る場合の stdev は 0 (不偏分散が定義できない)', () => {
    // n = 5 / 40% → 上下 2 件ずつ落として真ん中の 1 件だけが残る。
    const result = buildMeasureResult('trim-single', 5, 0, [1, 2, 3, 4, 5], 40);

    expect(result.trimmed?.sampleCount).toBe(1);
    expect(result.trimmed?.mean).toBe(3);
    expect(result.trimmed?.p50).toBe(3);
    expect(result.trimmed?.p95).toBe(3);
    expect(result.trimmed?.p99).toBe(3);
    expect(result.trimmed?.stdev).toBe(0);
  });

  it('T-PH-M-015 trimPercent 既定 (0) では trimmed を持たない', () => {
    const result = buildMeasureResult('trim-off', 4, 0, [1, 2, 3, 4]);
    expect(result.trimmed).toBeUndefined();
  });

  it('T-PH-M-016 measure 経由でも trimPercent が trimmed に伝わる', async () => {
    const result = await measure({
      name: 'trim-through-measure',
      iterations: 10,
      trimPercent: 10,
      fn: () => {},
    });

    expect(result.trimmed?.percent).toBe(10);
    expect(result.trimmed?.sampleCount).toBe(8);
  });
});

describe('measureAlternating — 引数の検証', () => {
  /** 交互測定の基準 op。 検証だけを見るので中身は空でよい。 */
  const reference = {
    kind: 'cpu' as const,
    name: 'ref.cpu',
    implVersion: 1,
    fn: () => {},
  };

  it('T-PH-M-017 iterations < 1 を測る前に弾く', async () => {
    await expect(
      measureAlternating({ name: 'bad', fn: () => {}, reference, iterations: 0 }),
    ).rejects.toThrow('measureAlternating: iterations must be >= 1');
  });

  it('T-PH-M-018 負の warmup を測る前に弾く', async () => {
    await expect(
      measureAlternating({ name: 'bad', fn: () => {}, reference, iterations: 1, warmup: -1 }),
    ).rejects.toThrow('measureAlternating: warmup must be >= 0');
  });

  it('T-PH-M-019 warmup の捨て回しは対象と基準を同数だけ呼ぶ', async () => {
    let targetCalls = 0;
    let referenceCalls = 0;
    const result = await measureAlternating({
      name: 'alternating',
      fn: () => {
        targetCalls += 1;
        tinyWork();
      },
      reference: {
        ...reference,
        fn: () => {
          referenceCalls += 1;
          tinyWork();
        },
      },
      iterations: 5,
      warmup: 2,
    });

    // 捨て回しでも「基準 → 対象」 の対で回す。 片方だけ暖めると比に暖機の差が乗る。
    expect(targetCalls).toBe(7);
    expect(referenceCalls).toBe(7);
    expect(result.target.warmup).toBe(2);
    expect(result.reference.warmup).toBe(2);
    expect(result.ratio).toBeCloseTo(result.target.p10 / result.reference.p10, 12);
  });
});

describe('measureHarnessResolution — 既定値', () => {
  it('T-PH-M-020 引数なしでも既定の反復数で分解能を返す', async () => {
    const resolution = await measureHarnessResolution();

    expect(Number.isFinite(resolution)).toBe(true);
    expect(resolution).toBeGreaterThan(0);
    // 何もしない呼出の往復が 1ms を超えるなら、 測っている経路が違う。
    expect(resolution).toBeLessThan(1);
  });
});
