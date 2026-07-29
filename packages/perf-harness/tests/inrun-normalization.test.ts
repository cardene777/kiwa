/**
 * 実行内正規化 (#1737) の test。
 *
 * 回帰判定は別々の実行で測った値を比べるため、 実行と実行の間で機械の状態が
 * 変われば実装が同じでも差が出る。 同じ実行の中で交互に測った基準 op との比で
 * 判定すると、 その差が分子と分母で相殺される。
 *
 * ここで固定するのは 4 点。 (1) 交互測定が対象と基準の両方を返し対象に基準を
 * 添えること、 (2) 機械全体が遅くなっただけの実行を stable と判定すること、
 * (3) 対象だけが遅くなった実行を regressed と判定すること、 (4) 正規化が
 * 成立しない組は比較せず作り直しに回すこと。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import {
  BASELINE_SCHEMA,
  buildMeasureResult,
  captureEnv,
  createReferenceOps,
  detectRegression,
  measureAlternating,
  resolveNormalization,
  runPerf3Layer,
} from '../src/index.js';
import type { MeasureResult, PerfReferenceKind } from '../src/index.js';

/** 交互測定を経た結果を組み立てる。 baseline / current の両側を手で作るため。 */
function withReference(
  samples: number[],
  referenceP10: number,
  kind: PerfReferenceKind = 'cpu',
): MeasureResult {
  const result = buildMeasureResult('op.serial', samples.length, 0, samples);
  result.reference = { kind, name: `harness.reference.${kind}`, p10: referenceP10 };
  return result;
}

describe('measureAlternating — 対象と基準を 1 呼出ずつ交互に測る', () => {
  it('対象 ・ 基準 ・ 比の 3 つを返し、 対象に基準の p10 を添える', async () => {
    const references = createReferenceOps();
    try {
      const result = await measureAlternating({
        name: 'op.serial',
        iterations: 20,
        warmup: 2,
        reference: references.get('cpu'),
        fn: () => {},
      });

      expect(result.target.name).toBe('op.serial');
      expect(result.target.samples).toHaveLength(20);
      expect(result.reference.name).toBe('harness.reference.cpu');
      expect(result.reference.samples).toHaveLength(20);
      // 判定に持ち回るのは対象 1 つで足りるよう、 分母を対象側に埋める。
      expect(result.target.reference).toEqual({
        kind: 'cpu',
        name: 'harness.reference.cpu',
        p10: result.reference.p10,
      });
      expect(result.ratio).toBeCloseTo(result.target.p10 / result.reference.p10, 10);
    } finally {
      references.dispose();
    }
  });

  it('対象と基準を同じ回数ずつ呼ぶ (warmup も両方に効く)', async () => {
    let targetCalls = 0;
    let referenceCalls = 0;
    const result = await measureAlternating({
      name: 'op.serial',
      iterations: 7,
      warmup: 3,
      reference: {
        kind: 'cpu',
        name: 'stub.reference',
        fn: () => {
          referenceCalls += 1;
          // 分母が 0 だと判定に使えないので、 計時できる程度の仕事をさせる。
          let acc = 0;
          for (let index = 0; index < 5_000; index += 1) acc = (acc * 31 + index) % 1_000_003;
          if (acc === -1) throw new Error('unreachable');
        },
      },
      fn: () => {
        targetCalls += 1;
      },
    });

    expect(targetCalls).toBe(10);
    expect(referenceCalls).toBe(10);
    expect(result.target.warmup).toBe(3);
  });

  it('基準の p10 が 0 の測定は分母にできないので落とす', async () => {
    // 計時が止まっている状況を作る。 実機では基準を計時の粒度の数百倍に
    // 選んであるため起きないが、 起きた時に黙って正規化なしへ落ちると
    // その実行だけ実行間のずれを含んだまま gate にかかる。
    const frozen = vi.spyOn(process.hrtime, 'bigint').mockReturnValue(0n);
    try {
      await expect(
        measureAlternating({
          name: 'op.serial',
          iterations: 5,
          reference: { kind: 'cpu', name: 'stub.zero', fn: () => {} },
          fn: () => {},
        }),
      ).rejects.toThrow(/分母にできない/);
    } finally {
      frozen.mockRestore();
    }
  });
});

describe('resolveNormalization — 換算倍率の成立条件', () => {
  it('同じ種類の基準が双方にあれば baseline 側の基準 p10 で換算する', () => {
    const current = withReference([2, 2, 2], 0.2);
    const baseline = withReference([1, 1, 1], 0.1);
    // 機械が 2 倍遅くなっただけ。 倍率 0.1/0.2 = 0.5 を今回に掛けると baseline に戻る。
    expect(resolveNormalization(current, baseline)).toEqual({ scale: 0.5, normalized: true });
  });

  it('基準の種類が違えば分母の意味が違うので正規化しない', () => {
    const current = withReference([1, 1, 1], 0.1, 'fs-read');
    const baseline = withReference([1, 1, 1], 0.1, 'cpu');
    expect(resolveNormalization(current, baseline)).toEqual({ scale: 1, normalized: false });
  });

  it('片方に基準が無い組 (v1 baseline / live mode) は正規化しない', () => {
    const current = withReference([1, 1, 1], 0.1);
    const legacy = buildMeasureResult('op.serial', 3, 0, [1, 1, 1]);
    expect(resolveNormalization(current, legacy)).toEqual({ scale: 1, normalized: false });
    expect(resolveNormalization(legacy, current)).toEqual({ scale: 1, normalized: false });
  });
});

describe('detectRegression — 比で判定する', () => {
  /** 実装は同じで機械だけが `factor` 倍遅い実行。 対象も基準も同じだけ伸びる。 */
  function slowerMachine(baselineSamples: number[], referenceP10: number, factor: number) {
    return {
      current: withReference(
        baselineSamples.map((sample) => sample * factor),
        referenceP10 * factor,
      ),
      baseline: withReference(baselineSamples, referenceP10),
    };
  }

  it('機械全体が 2 倍遅い実行は stable のまま', () => {
    const samples = Array.from({ length: 100 }, (_, index) => 1 + (index % 5) * 0.01);
    const result = detectRegression({ ...slowerMachine(samples, 0.1, 2), resolutionMs: 0.0001 });

    expect(result.normalized).toBe(true);
    expect(result.normalizationScale).toBeCloseTo(0.5, 10);
    // 素の値は 2 倍 = +100% だが、 分母も 2 倍なので比は動かない。
    expect(result.deltaPct).toBeCloseTo(0, 6);
    expect(result.verdict).toBe('stable');
  });

  it('正規化なしなら同じ入力が regressed になる (正規化が効いていることの対照)', () => {
    const samples = Array.from({ length: 100 }, (_, index) => 1 + (index % 5) * 0.01);
    const { current, baseline } = slowerMachine(samples, 0.1, 2);
    delete current.reference;
    delete baseline.reference;

    const result = detectRegression({ current, baseline, resolutionMs: 0.0001 });
    expect(result.normalized).toBe(false);
    expect(result.deltaPct).toBeCloseTo(1, 6);
    expect(result.verdict).toBe('regressed');
  });

  it('基準が動かず対象だけ 3 倍になった実行は regressed', () => {
    const samples = Array.from({ length: 100 }, (_, index) => 1 + (index % 5) * 0.01);
    const result = detectRegression({
      current: withReference(samples.map((sample) => sample * 3), 0.1),
      baseline: withReference(samples, 0.1),
      resolutionMs: 0.0001,
    });

    expect(result.normalized).toBe(true);
    expect(result.deltaPct).toBeCloseTo(2, 6);
    expect(result.verdict).toBe('regressed');
  });

  it('絶対下限は換算後の ms で効く (比にしても下限の意味は変わらない)', () => {
    // 対象 0.001ms → 0.003ms。 相対では +200% だが差は 0.002ms しかない。
    const baselineSamples = Array.from({ length: 100 }, () => 0.001);
    const result = detectRegression({
      current: withReference(baselineSamples.map((sample) => sample * 3), 0.1),
      baseline: withReference(baselineSamples, 0.1),
      minDeltaMs: 0.01,
    });

    expect(result.verdict).toBe('stable');
    expect(result.suppressedByFloor).toBe(true);
  });
});

describe('runPerf3Layer — baseline に基準が残り、 次の実行で読み戻される', () => {
  const created: string[] = [];

  function tempDir(): string {
    const dir = mkdtempSync(join(os.tmpdir(), 'perf-harness-inrun-'));
    created.push(dir);
    return dir;
  }

  afterEach(() => {
    while (created.length > 0) {
      const dir = created.pop();
      if (dir) rmSync(dir, { recursive: true, force: true });
    }
  });

  const settings = {
    serialIterations: 20,
    serialWarmup: 2,
    concurrency: 2,
    iterationsPerWorker: 3,
    memoryIterations: 20,
  };

  it('baseline に基準の種類と p10 を記録し、 report に比と実測値の両方を出す', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    const reportPath = join(tmpDir, 'report.md');

    await runPerf3Layer({
      moduleName: 'inrun',
      ops: [{ name: 'op', fn: () => {}, serialP95CapMs: 10_000, referenceKind: 'fs-read' }],
      reportPath,
      baselinePath,
      ...settings,
    });

    const stored = JSON.parse(readFileSync(baselinePath, 'utf8')) as {
      schema: number;
      results: Record<string, MeasureResult>;
    };
    expect(stored.schema).toBe(BASELINE_SCHEMA);
    const serial = stored.results['op.serial']!;
    expect(serial.reference?.kind).toBe('fs-read');
    expect(serial.reference?.p10).toBeGreaterThan(0);
    // 上限判定は 1 回の実行で完結するので正規化の対象外。 基準も付けない。
    expect(stored.results['op.concurrent']?.reference).toBeUndefined();

    const report = readFileSync(reportPath, 'utf8');
    expect(report).toContain('## 実行内正規化 (回帰判定はこの比で行う)');
    expect(report).toMatch(/\| op \| fs-read \|/);
  });

  it('2 回目の実行は比で判定する (比較が成立して n/a を抜ける)', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    const op = { name: 'op', fn: () => {}, serialP95CapMs: 10_000 };

    const first = await runPerf3Layer({
      moduleName: 'inrun',
      ops: [op],
      reportPath: join(tmpDir, 'r1.md'),
      baselinePath,
      ...settings,
    });
    expect(first.outcomes[0]!.regressionVerdict).toBe('n/a (baseline seeded)');

    const second = await runPerf3Layer({
      moduleName: 'inrun',
      ops: [op],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      ...settings,
    });
    expect(second.outcomes[0]!.regressionVerdict).not.toBe('n/a (baseline seeded)');
    expect(second.outcomes[0]!.regression?.normalized).toBe(true);
  });

  it('基準の種類を変えた op は比較せず、 同じ実行で baseline を書き直す', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');

    await runPerf3Layer({
      moduleName: 'inrun',
      ops: [{ name: 'op', fn: () => {}, serialP95CapMs: 10_000, referenceKind: 'cpu' }],
      reportPath: join(tmpDir, 'r1.md'),
      baselinePath,
      ...settings,
    });

    // 種類が違う分母を掛けても相殺は起きない。 比較を飛ばして記録を入れ替える。
    // 書き直さないと、 key は既にあるため追記もされず永久に n/a に留まる。
    const switched = await runPerf3Layer({
      moduleName: 'inrun',
      ops: [{ name: 'op', fn: () => {}, serialP95CapMs: 10_000, referenceKind: 'fs-write' }],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      ...settings,
    });
    expect(switched.outcomes[0]!.regressionVerdict).toBe('n/a (baseline seeded)');

    const stored = JSON.parse(readFileSync(baselinePath, 'utf8')) as {
      results: Record<string, MeasureResult>;
    };
    expect(stored.results['op.serial']?.reference?.kind).toBe('fs-write');

    const third = await runPerf3Layer({
      moduleName: 'inrun',
      ops: [{ name: 'op', fn: () => {}, serialP95CapMs: 10_000, referenceKind: 'fs-write' }],
      reportPath: join(tmpDir, 'r3.md'),
      baselinePath,
      ...settings,
    });
    expect(third.outcomes[0]!.regressionVerdict).not.toBe('n/a (baseline seeded)');
  });

  it('基準の記録が無い世代の baseline は比較に使わない', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    // 版が同じでも基準が無ければ比は作れない。 実測値そのものの比較へ黙って
    // 落とすと、 実行間のずれを含んだまま gate にかかる。
    writeFileSync(
      baselinePath,
      JSON.stringify({
        schema: 1,
        env: captureEnv(),
        results: {
          'op.serial': buildMeasureResult('op.serial', 20, 2, Array.from({ length: 20 }, () => 1)),
          'op.concurrent': buildMeasureResult(
            'op.concurrent',
            6,
            2,
            Array.from({ length: 6 }, () => 1),
          ),
        },
      }),
      'utf8',
    );

    const run = await runPerf3Layer({
      moduleName: 'inrun',
      ops: [{ name: 'op', fn: () => {}, serialP95CapMs: 10_000 }],
      reportPath: join(tmpDir, 'r1.md'),
      baselinePath,
      ...settings,
    });

    expect(run.outcomes[0]!.regressionVerdict).toBe('n/a (baseline seeded)');
    const stored = JSON.parse(readFileSync(baselinePath, 'utf8')) as {
      results: Record<string, MeasureResult>;
    };
    expect(stored.results['op.serial']?.reference?.kind).toBe('cpu');
  });

  it('baseline の 3 倍の遅延を入れた op は比の判定で regressed になる', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    /** `ms` だけ回す op。 基準 (約 0.09ms) より十分大きく取り、 下限に埋もれさせない。 */
    const burn = (ms: number) => () => {
      const until = performance.now() + ms;
      while (performance.now() < until) {
        /* burn */
      }
    };

    await runPerf3Layer({
      moduleName: 'inrun-3x',
      ops: [{ name: 'op', fn: burn(0.3), serialP95CapMs: 10_000 }],
      reportPath: join(tmpDir, 'r1.md'),
      baselinePath,
      ...settings,
    });

    const slowed = await runPerf3Layer({
      moduleName: 'inrun-3x',
      ops: [{ name: 'op', fn: burn(0.9), serialP95CapMs: 10_000 }],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      // 既定では判定を gate に載せないので、 検知そのものを見るために明示する。
      regressionGate: true,
      ...settings,
    });

    expect(slowed.outcomes[0]!.regression?.normalized).toBe(true);
    expect(slowed.outcomes[0]!.regressionVerdict).toBe('regressed');
    // 上限には収まっているので、 落ちたのは回帰判定だけ。
    expect(slowed.outcomes[0]!.serialGatePassed).toBe(true);
    expect(slowed.allPassed).toBe(false);
  });

  it('上限の判定は実測値のまま (正規化は回帰判定にしか効かない)', async () => {
    const tmpDir = tempDir();
    // 1ms 級の op を 0.1ms の上限にかける。 比で見れば基準より速い実行でも、
    // 上限は 1 回の実行の中で完結する判定なので実測値で落ちる。
    const run = await runPerf3Layer({
      moduleName: 'inrun-cap',
      ops: [
        {
          name: 'slow',
          fn: () => {
            const until = performance.now() + 1;
            while (performance.now() < until) {
              /* burn */
            }
          },
          serialP95CapMs: 0.1,
        },
      ],
      reportPath: join(tmpDir, 'r1.md'),
      baselinePath: join(tmpDir, 'baseline.json'),
      ...settings,
    });

    expect(run.outcomes[0]!.serialGatePassed).toBe(false);
    expect(run.allPassed).toBe(false);
  });
});
