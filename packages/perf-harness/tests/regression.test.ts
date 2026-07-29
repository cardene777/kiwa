import { describe, expect, it } from 'vitest';
import {
  RESOLUTION_FLOOR_MULTIPLE,
  buildMeasureResult,
  detectRegression,
} from '../src/index.js';

function makeResult(name: string, samples: number[]) {
  return buildMeasureResult(name, samples.length, 0, samples);
}

describe('detectRegression (bootstrap CI on p10)', () => {
  it('T-PH-R-001 flags a 20%+ p95 slowdown as regressed', () => {
    // 大きめの sample を使い bootstrap CI が締まるようにする。
    const baseline = makeResult('reply', Array.from({ length: 40 }, (_, i) => 10 + (i % 3) * 0.05));
    const current = makeResult('reply', Array.from({ length: 40 }, (_, i) => 13 + (i % 3) * 0.05));
    const result = detectRegression({ current, baseline });

    expect(result.regressed).toBe(true);
    expect(result.deltaPct).toBeGreaterThanOrEqual(0.2);
    expect(result.verdict).toBe('regressed');
    expect(result.significant).toBe(true);
    expect(result.ci.lower).toBeGreaterThan(0);
  });

  it('T-PH-R-002 flags clear 30% and 50% slowdowns when significant', () => {
    const baseline = makeResult('reply', Array.from({ length: 40 }, (_, i) => 10 + (i % 4) * 0.1));
    const thirty = makeResult('reply', Array.from({ length: 40 }, (_, i) => 13 + (i % 4) * 0.1));
    const fifty = makeResult('reply', Array.from({ length: 40 }, (_, i) => 15 + (i % 4) * 0.1));

    const thirtyResult = detectRegression({ current: thirty, baseline });
    const fiftyResult = detectRegression({ current: fifty, baseline });

    expect(thirtyResult.verdict).toBe('regressed');
    expect(thirtyResult.significant).toBe(true);
    expect(fiftyResult.verdict).toBe('regressed');
    // fifty は more strong signal、 CI 下限も上位。
    expect(fiftyResult.ci.lower).toBeGreaterThan(thirtyResult.ci.lower);
  });

  it('T-PH-R-003 reports improved when p95 drops past the threshold', () => {
    const baseline = makeResult('reply', Array.from({ length: 40 }, (_, i) => 10 + (i % 3) * 0.05));
    const current = makeResult('reply', Array.from({ length: 40 }, (_, i) => 7 + (i % 3) * 0.05));
    const result = detectRegression({ current, baseline });

    expect(result.verdict).toBe('improved');
    expect(result.regressed).toBe(false);
    expect(result.deltaPct).toBeLessThan(-0.2);
    expect(result.ci.upper).toBeLessThan(0);
  });

  it('T-PH-R-004 threshold 超過してない差は stable (deltaPct < threshold)', () => {
    // deltaPct 3% は 20% threshold 未満 = 統計的に有意でも regressed にならない。
    const baseline = makeResult('reply', Array.from({ length: 40 }, (_, i) => 10 + (i % 5) * 0.02));
    const current = makeResult('reply', Array.from({ length: 40 }, (_, i) => 10.3 + (i % 5) * 0.02));
    const result = detectRegression({ current, baseline, threshold: 0.2 });

    expect(result.deltaPct).toBeLessThan(0.2);
    expect(result.verdict).toBe('stable');
    expect(result.regressed).toBe(false);
  });

  it('T-PH-R-005 stays stable for tiny sample counts (<2)', () => {
    const baseline = makeResult('reply', [10]);
    const current = makeResult('reply', [20]);
    const result = detectRegression({ current, baseline, threshold: 0.2 });

    expect(result.significant).toBe(false);
    expect(result.ci).toEqual({ lower: 0, upper: 0 });
    expect(result.verdict).toBe('stable');
  });

  it('T-PH-R-006 both baseline and current p95 = 0 gives deltaPct = 0 (not Infinity)', () => {
    const baseline = makeResult('reply', [0, 0, 0, 0, 0]);
    const current = makeResult('reply', [0, 0, 0, 0, 0]);
    const result = detectRegression({ current, baseline });
    expect(result.deltaPct).toBe(0);
    expect(result.verdict).toBe('stable');
  });

  it('T-PH-R-007 empty-samples baseline は退化 CI で stable 判定', () => {
    const baseline = makeResult('reply', []);
    const current = makeResult('reply', [10, 11, 12]);
    const result = detectRegression({ current, baseline });
    expect(result.verdict).toBe('stable');
    expect(result.significant).toBe(false);
  });

  it('T-PH-R-008 identical repeated samples produce CI ≈ 0 → stable', () => {
    const baseline = makeResult('reply', [10, 10, 10, 10, 10]);
    const current = makeResult('reply', [10, 10, 10, 10, 10]);
    const result = detectRegression({ current, baseline });
    expect(result.ci.lower).toBe(0);
    expect(result.ci.upper).toBe(0);
    expect(result.verdict).toBe('stable');
  });

  it('T-PH-R-010 測定系が帰属できない大きさの差は回帰と判定しない', () => {
    // 0.03ms → 0.04ms は 33% 悪化。 測定系の分解能が 0.02ms なら、 この 0.01ms は
    // op ではなく harness 自身の往復を見ている可能性と区別がつかない。
    const baseline = makeResult('reply', [0.03, 0.03, 0.03, 0.03, 0.03, 0.03]);
    const current = makeResult('reply', [0.04, 0.04, 0.04, 0.04, 0.04, 0.04]);
    const result = detectRegression({ current, baseline, resolutionMs: 0.02 });
    expect(result.deltaPct).toBeGreaterThan(0.2);
    expect(result.significant).toBe(true);
    expect(result.verdict).toBe('stable');
  });

  it('T-PH-R-010b 分解能を下回らない差は同じ大きさでも回帰と判定する (#1718)', () => {
    // 同じ 0.03ms → 0.04ms でも、 測定系が 0.001ms を帰属できるなら op の変化として読める。
    // 下限が固定値でなく測定系の性能で決まることを示す対の test。
    const baseline = makeResult('reply', [0.03, 0.03, 0.03, 0.03, 0.03, 0.03]);
    const current = makeResult('reply', [0.04, 0.04, 0.04, 0.04, 0.04, 0.04]);
    const result = detectRegression({ current, baseline, resolutionMs: 0.001 });
    expect(result.verdict).toBe('regressed');
  });

  it('T-PH-R-011 下限を超える悪化は従来どおり回帰と判定する', () => {
    const baseline = makeResult('reply', [10, 10, 10, 10, 10, 10]);
    const current = makeResult('reply', [13, 13, 13, 13, 13, 13]);
    const result = detectRegression({ current, baseline });
    expect(result.verdict).toBe('regressed');
  });

  it('T-PH-R-012 下限は minDeltaMs で調整できる', () => {
    const baseline = makeResult('reply', [0.03, 0.03, 0.03, 0.03, 0.03, 0.03]);
    const current = makeResult('reply', [0.04, 0.04, 0.04, 0.04, 0.04, 0.04]);
    const result = detectRegression({ current, baseline, minDeltaMs: 0 });
    expect(result.verdict).toBe('regressed');
  });

  it('T-PH-R-013 下限で抑えた stable は「変化が無い」 stable と区別できる (#1708)', () => {
    // 相対では 33% 悪化だが差は 0.01ms。従来はこれも素の stable と同じ表現だった。
    const baseline = makeResult('reply', [0.03, 0.03, 0.03, 0.03, 0.03, 0.03]);
    const current = makeResult('reply', [0.04, 0.04, 0.04, 0.04, 0.04, 0.04]);
    const result = detectRegression({ current, baseline, resolutionMs: 0.02 });

    expect(result.verdict).toBe('stable');
    expect(result.suppressedByFloor).toBe(true);
    expect(result.floorMs).toBe(0.02 * RESOLUTION_FLOOR_MULTIPLE);
  });

  it('T-PH-R-013b 下限は分解能そのものではなく定数倍で置く (#1718)', () => {
    // 分解能ちょうどを下限にすると、 分解能と同じ帯にいる op で判定が入れ替わる
    // (実装無変更の 4 連続実行で `keydb` の p10 が 1 度だけ 0.00013 → 0.00033ms へ動いた)。
    // 差が分解能を超えていても定数倍に届かなければ保留する。
    const baseline = makeResult('reply', Array.from({ length: 20 }, () => 0.00013));
    const current = makeResult('reply', Array.from({ length: 20 }, () => 0.00033));
    const result = detectRegression({ current, baseline, resolutionMs: 0.00017 });

    expect(Math.abs(result.judged.current - result.judged.baseline)).toBeGreaterThan(0.00017);
    expect(result.verdict).toBe('stable');
    expect(result.suppressedByFloor).toBe(true);
  });

  it('T-PH-R-013c 下限の定数倍は明示指定で上書きできる (#1718)', () => {
    const baseline = makeResult('reply', Array.from({ length: 20 }, () => 0.00013));
    const current = makeResult('reply', Array.from({ length: 20 }, () => 0.00033));
    const result = detectRegression({
      current,
      baseline,
      resolutionMs: 0.00017,
      minDeltaMs: 0.0001,
    });

    expect(result.floorMs).toBe(0.0001);
    expect(result.verdict).toBe('regressed');
  });

  it('T-PH-R-014 変化が無い stable は下限で抑えた扱いにしない (#1708)', () => {
    const baseline = makeResult('reply', [10, 10, 10, 10, 10, 10]);
    const current = makeResult('reply', [10, 10, 10, 10, 10, 10]);
    const result = detectRegression({ current, baseline });

    expect(result.verdict).toBe('stable');
    expect(result.suppressedByFloor).toBe(false);
  });

  it('T-PH-R-015 baseline が下限未満の op は感度が落ちていると分かる (#1708)', () => {
    // 分解能 0.05ms の測定系で baseline 0.03ms の op を測っている状態。
    // harness の往復より速い処理なので、 検知には baseline を超える悪化が要る。
    const baseline = makeResult('reply', [0.03, 0.03, 0.03, 0.03, 0.03, 0.03]);
    const current = makeResult('reply', [0.03, 0.03, 0.03, 0.03, 0.03, 0.03]);
    const result = detectRegression({ current, baseline, resolutionMs: 0.05 });

    expect(result.belowDetectionFloor).toBe(true);
  });

  it('T-PH-R-015b sub-ms の op でも分解能を上回れば検知できる状態になる (#1718)', () => {
    // 旧実装は下限が固定 0.5ms だったため、 baseline 0.03ms の op は何をしても
    // belowDetectionFloor が立ち、 3 倍遅くなっても stable のままだった。
    const baseline = makeResult('reply', [0.03, 0.03, 0.03, 0.03, 0.03, 0.03]);
    const current = makeResult('reply', [0.09, 0.09, 0.09, 0.09, 0.09, 0.09]);
    const result = detectRegression({ current, baseline, resolutionMs: 0.0002 });

    expect(result.belowDetectionFloor).toBe(false);
    expect(result.verdict).toBe('regressed');
  });

  it('T-PH-R-017 baseline が下限未満でも下限を超える悪化は検知する (#1708)', () => {
    // 感度が落ちることと検知できないことは違う。0.29ms → 3.24ms は
    // 差が 2.95ms なので下限を超え、regressed と判定されなければならない。
    const baseline = makeResult('reply', [0.29, 0.29, 0.29, 0.29, 0.29, 0.29]);
    const current = makeResult('reply', [3.24, 3.24, 3.24, 3.24, 3.24, 3.24]);
    const result = detectRegression({ current, baseline, resolutionMs: 0.5 });

    expect(result.belowDetectionFloor).toBe(true);
    expect(result.verdict).toBe('regressed');
  });

  it('T-PH-R-016 baseline が下限以上の op は検知不能扱いにしない (#1708)', () => {
    const baseline = makeResult('reply', [10, 10, 10, 10, 10, 10]);
    const current = makeResult('reply', [10, 10, 10, 10, 10, 10]);
    const result = detectRegression({ current, baseline, resolutionMs: 0.5 });

    expect(result.belowDetectionFloor).toBe(false);
  });

  it('T-PH-R-009 baseline.p10 = 0 かつ current.p10 > 0 = Infinity delta', () => {
    // Bootstrap CI は current 側 sample から p10 > 0 を復元、 baseline は 0 になるため
    // CI 下限は正の値、 deltaPct は Infinity。 verdict は significant + threshold 超過。
    const baseline = makeResult('reply', [0, 0, 0, 0, 0, 0]);
    const current = makeResult('reply', [10, 10, 10, 10, 10, 10]);
    const result = detectRegression({ current, baseline });
    expect(result.deltaPct).toBe(Number.POSITIVE_INFINITY);
    expect(result.verdict).toBe('regressed');
  });

  it('T-PH-R-018 裾だけが伸びた変化は判定に載らず tailDeltaPct に出る (#1718)', () => {
    // 下側 10% は同じで、上位だけが 5 倍になった分布。 実装の変化ではなく
    // 測定中に入った邪魔もこの形をとるため、 実行をまたいで判定に使えない。
    const baseline = makeResult('reply', [10, 10, 10, 10, 10, 10, 10, 10, 10, 12]);
    const current = makeResult('reply', [10, 10, 10, 10, 10, 10, 10, 10, 10, 60]);
    const result = detectRegression({ current, baseline, resolutionMs: 0.0001 });

    expect(result.verdict).toBe('stable');
    expect(result.deltaPct).toBeCloseTo(0, 5);
    expect(result.tailDeltaPct).toBeGreaterThan(1);
  });

  it('T-PH-R-018b 下側が閾値未満で動いていても裾の報告は成立する (#1718)', () => {
    // p10 が +19% (閾値 20% 未満) で p95 が大きく伸びた分布。 「下側は動かず」 と
    // 書くと事実に反するため、 呼出側が両方の数字を出せることを担保する。
    const baseline = makeResult('reply', [10, 10, 10, 10, 10, 10, 10, 10, 10, 12]);
    const current = makeResult('reply', [11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 11.9, 60]);
    const result = detectRegression({ current, baseline, resolutionMs: 0.0001 });

    expect(result.verdict).toBe('stable');
    expect(result.deltaPct).toBeGreaterThan(0.1);
    expect(result.deltaPct).toBeLessThan(0.2);
    expect(result.tailDeltaPct).toBeGreaterThan(0.2);
  });

  it('T-PH-R-019 判定は上側の裾ではなく下側の移動で決まる (#1718)', () => {
    // 分布全体が 30% 遅くなった場合は下側も動くので regressed。
    // T-PH-R-018 と対で「裾だけ / 全体」 の違いが判定に出ることを示す。
    const baseline = makeResult('reply', Array.from({ length: 40 }, (_, i) => 10 + (i % 4) * 0.1));
    const current = makeResult('reply', Array.from({ length: 40 }, (_, i) => 13 + (i % 4) * 0.1));
    const result = detectRegression({ current, baseline, resolutionMs: 0.0001 });

    expect(result.verdict).toBe('regressed');
    expect(result.judged.baseline).toBeCloseTo(10, 1);
    expect(result.judged.current).toBeCloseTo(13, 1);
  });

  it('T-PH-R-020 p10 field を持たない結果も sample から判定できる (#1718)', () => {
    // `loadBaseline` は読込時に全 field を作り直すが、 API を直接叩く呼出は
    // p10 を持たない結果を渡せる。 その場合は sample から計算して判定を成立させる。
    const baseline = makeResult('reply', [10, 10, 10, 10, 10, 10]);
    const legacy = { ...baseline } as Record<string, unknown>;
    delete legacy['p10'];
    const current = makeResult('reply', [13, 13, 13, 13, 13, 13]);
    const result = detectRegression({
      current,
      baseline: legacy as unknown as ReturnType<typeof makeResult>,
      resolutionMs: 0.0001,
    });

    expect(result.judged.baseline).toBe(10);
    expect(result.verdict).toBe('regressed');
  });

  it('T-PH-R-021 判定に使う値は report が表示する field と同じものになる (#1718)', () => {
    // 判定が sample を、 report が保存 field を読むと、 同じ行に regressed と
    // 改善を示す差分が並ぶ。 field があるならそれを判定にも使う。
    const baseline = makeResult('reply', [10, 10, 10, 10, 10, 10]);
    const current = makeResult('reply', [13, 13, 13, 13, 13, 13]);
    const result = detectRegression({ current, baseline, resolutionMs: 0.0001 });

    expect(result.judged.baseline).toBe(baseline.p10);
    expect(result.judged.current).toBe(current.p10);
  });
});
