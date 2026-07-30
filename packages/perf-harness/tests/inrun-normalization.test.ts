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
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import {
  BASELINE_SCHEMA,
  RESOLUTION_FLOOR_MULTIPLE,
  REFERENCE_IMPL_VERSION,
  buildMeasureResult,
  captureEnv,
  createReferenceOps,
  detectRegression,
  loadBaseline,
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
  result.reference = {
    kind,
    name: `harness.reference.${kind}`,
    p10: referenceP10,
    implVersion: REFERENCE_IMPL_VERSION,
  };
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
        implVersion: REFERENCE_IMPL_VERSION,
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
        implVersion: REFERENCE_IMPL_VERSION,
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
          reference: {
            kind: 'cpu',
            name: 'stub.zero',
            implVersion: REFERENCE_IMPL_VERSION,
            fn: () => {},
          },
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

  it('分解能由来の下限には倍率が掛かり、 呼出が置いた下限には掛からない', () => {
    const samples = Array.from({ length: 100 }, () => 1);
    // 機械が 4 倍遅い実行。 倍率は 0.1/0.4 = 0.25。
    const slow = {
      current: withReference(samples, 0.4),
      baseline: withReference(samples, 0.1),
    };

    // 分解能も今回の実行で測った値なので、 差と同じ単位へ揃える = 倍率を掛ける。
    // 掛けないと機械が遅い実行だけ下限が 4 倍厳しくなり、 検知できる悪化の
    // 大きさがその日の機械で変わる。
    const fromResolution = detectRegression({ ...slow, resolutionMs: 0.02 });
    expect(fromResolution.normalizationScale).toBeCloseTo(0.25, 10);
    expect(fromResolution.floorMs).toBeCloseTo(0.02 * RESOLUTION_FLOOR_MULTIPLE * 0.25, 10);

    // 呼出が置いた定数はどの実行の測定値でもないので換算しない。
    const explicit = detectRegression({ ...slow, resolutionMs: 0.02, minDeltaMs: 0.5 });
    expect(explicit.floorMs).toBe(0.5);

    // 正規化が成立しない組では倍率 1 = 従来どおり。
    const raw = detectRegression({
      current: buildMeasureResult('op.serial', 100, 0, samples),
      baseline: buildMeasureResult('op.serial', 100, 0, samples),
      resolutionMs: 0.02,
    });
    expect(raw.normalized).toBe(false);
    expect(raw.floorMs).toBeCloseTo(0.02 * RESOLUTION_FLOOR_MULTIPLE, 10);
  });

  it('分母が非有限や 0 になる組は正規化せず、 判定を実測値に戻す', () => {
    const samples = Array.from({ length: 100 }, () => 1);
    // どちらも `> 0` は満たすが分母にできない。 通すと倍率が 0 や Infinity になり、
    // 判定量が 0 や NaN に落ちて 3 倍の悪化でも stable / improved が出る。
    for (const p10 of [Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(resolveNormalization(withReference(samples, p10), withReference(samples, 0.1))).toEqual(
        { scale: 1, normalized: false },
      );
      expect(resolveNormalization(withReference(samples, 0.1), withReference(samples, p10))).toEqual(
        { scale: 1, normalized: false },
      );
    }

    // 桁が離れて商が非有限になる場合も正規化しない。
    const overflow = resolveNormalization(
      withReference(samples, 5e-324),
      withReference(samples, 1e308),
    );
    expect(overflow.normalized).toBe(false);
  });

  it('基準 op の実装の版が違う組は比較しない', () => {
    const samples = Array.from({ length: 100 }, () => 1);
    const current = withReference(samples, 0.1);
    const baseline = withReference(samples, 0.1);
    baseline.reference = { ...baseline.reference!, implVersion: 999 };

    // 種類が同じでも実装を変えれば分母の大きさが変わる。 掛けると分母の差が
    // 実装の差として報告される (反復数を 2 倍にすれば全 op が 50% 改善に見える)。
    expect(resolveNormalization(current, baseline)).toEqual({ scale: 1, normalized: false });

    // 版の記録が無い世代も版不明として扱う。
    const legacy = withReference(samples, 0.1);
    delete legacy.reference!.implVersion;
    expect(resolveNormalization(current, legacy)).toEqual({ scale: 1, normalized: false });
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
    // 記録はあるので「seeded」 ではない。 比較しなかった理由を note に出す。
    expect(switched.outcomes[0]!.regressionVerdict).toBe('n/a (比較せず)');
    expect(switched.outcomes[0]!.regressionNote).toMatch(/基準 op の種類が baseline と違う/);
    expect(switched.outcomes[0]!.regressionNote).toContain('baseline cpu / 今回 fs-write');
    // 比較していない行に baseline 差分表を出さない (判定に使っていない差が
    // 判定結果と同じ重みで並ぶため)。
    expect(readFileSync(join(tmpDir, 'r2.md'), 'utf8')).not.toContain('## Baseline diff');

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

    // 記録はあるので seeded ではない。 理由は「基準 op の記録が無い世代」。
    expect(run.outcomes[0]!.regressionVerdict).toBe('n/a (比較せず)');
    expect(run.outcomes[0]!.regressionNote).toMatch(/基準 op の記録が無い世代/);
    const stored = JSON.parse(readFileSync(baselinePath, 'utf8')) as {
      results: Record<string, MeasureResult>;
    };
    expect(stored.results['op.serial']?.reference?.kind).toBe('cpu');
  });

  it('実装の版だけが違う組は、 種類ではなく版を理由として報告する', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    const op = { name: 'op', fn: () => {}, serialP95CapMs: 10_000 };

    await runPerf3Layer({
      moduleName: 'inrun',
      ops: [op],
      reportPath: join(tmpDir, 'r1.md'),
      baselinePath,
      ...settings,
    });

    // 版だけを書き換える。 種類は両方 cpu のままなので、 原因を種類に固定して
    // 書くと読み手は見つからない原因を探すことになる。
    const stored = JSON.parse(readFileSync(baselinePath, 'utf8')) as {
      env: unknown;
      results: Record<string, MeasureResult>;
    };
    stored.results['op.serial']!.reference!.implVersion = 999;
    writeFileSync(baselinePath, JSON.stringify({ schema: 2, ...stored }), 'utf8');

    const run = await runPerf3Layer({
      moduleName: 'inrun',
      ops: [op],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      ...settings,
    });

    expect(run.outcomes[0]!.regressionVerdict).toBe('n/a (比較せず)');
    expect(run.outcomes[0]!.regressionNote).toMatch(/実装の版が baseline と違う/);
    expect(run.outcomes[0]!.regressionNote).toContain('baseline 999');
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

  it('上限の判定は 3 軸すべて実測値のまま (正規化は回帰判定にしか効かない)', async () => {
    const burn = () => {
      const until = performance.now() + 1;
      while (performance.now() < until) {
        /* burn */
      }
    };
    const held: Buffer[] = [];

    // serial 上限。 比で見れば基準の何倍かに換算されるが、 上限は 1 回の実行の中で
    // 完結する判定なので実測値で落ちる。
    const serialRun = await runPerf3Layer({
      moduleName: 'inrun-cap-serial',
      ops: [{ name: 'slow', fn: burn, serialP95CapMs: 0.1, concurrentP95CapMs: 10_000 }],
      reportPath: join(tempDir(), 'serial.md'),
      baselinePath: join(tempDir(), 'serial.json'),
      ...settings,
    });
    expect(serialRun.outcomes[0]!.serialGatePassed).toBe(false);
    expect(serialRun.allPassed).toBe(false);

    // concurrent 上限。 serial 側は通す上限を置いて、 落ちる軸を 1 つに絞る。
    const concurrentRun = await runPerf3Layer({
      moduleName: 'inrun-cap-concurrent',
      ops: [{ name: 'slow', fn: burn, serialP95CapMs: 10_000, concurrentP95CapMs: 0.1 }],
      reportPath: join(tempDir(), 'concurrent.md'),
      baselinePath: join(tempDir(), 'concurrent.json'),
      ...settings,
    });
    expect(concurrentRun.outcomes[0]!.serialGatePassed).toBe(true);
    expect(concurrentRun.outcomes[0]!.concurrentGatePassed).toBe(false);
    expect(concurrentRun.allPassed).toBe(false);

    // memory 上限。 反復ごとに到達可能なまま Buffer を積む。
    const memoryRun = await runPerf3Layer({
      moduleName: 'inrun-cap-memory',
      ops: [
        {
          name: 'retain',
          fn: () => {
            held.push(Buffer.allocUnsafe(10 * 1024));
          },
          serialP95CapMs: 10_000,
          memoryArrayBuffersCapBytes: 1024,
        },
      ],
      reportPath: join(tempDir(), 'memory.md'),
      baselinePath: join(tempDir(), 'memory.json'),
      ...settings,
    });
    expect(memoryRun.outcomes[0]!.serialGatePassed).toBe(true);
    expect(memoryRun.outcomes[0]!.memoryGatePassed).toBe(false);
    expect(memoryRun.allPassed).toBe(false);
  });

  it('壊れた基準の記録を持つ baseline は読めない記録として扱う', async () => {
    const samples = Array.from({ length: 20 }, () => 1);
    const cases: Array<[string, unknown]> = [
      ['kind が未知', { kind: 'gpu', name: 'x', p10: 0.1, implVersion: 1 }],
      ['p10 が 0', { kind: 'cpu', name: 'x', p10: 0, implVersion: 1 }],
      ['p10 が非有限', { kind: 'cpu', name: 'x', p10: Number.MAX_VALUE * 2, implVersion: 1 }],
      ['name が数値', { kind: 'cpu', name: 1, p10: 0.1, implVersion: 1 }],
      ['implVersion が小数', { kind: 'cpu', name: 'x', p10: 0.1, implVersion: 1.5 }],
      ['reference が配列', []],
    ];

    for (const [label, reference] of cases) {
      const tmpDir = tempDir();
      const baselinePath = join(tmpDir, 'baseline.json');
      const stored = buildMeasureResult('op.serial', 20, 0, samples) as unknown as Record<
        string,
        unknown
      >;
      stored.reference = reference;
      writeFileSync(
        baselinePath,
        JSON.stringify({ schema: 2, env: captureEnv(), results: { 'op.serial': stored } }),
        'utf8',
      );
      // 1 件でも読めない記録があれば envelope 全体を無しとして扱う。 field だけ
      // 落として通すと、 正規化なしの比較へ黙って落ちる。
      expect(await loadBaseline(baselinePath), label).toBeNull();
    }

    // p10 が非有限でも JSON では null になるため、 素の JSON 文字列でも確かめる。
    const tmpDir = tempDir();
    const rawPath = join(tmpDir, 'raw.json');
    writeFileSync(
      rawPath,
      JSON.stringify({
        schema: 2,
        env: captureEnv(),
        results: {
          'op.serial': {
            ...buildMeasureResult('op.serial', 20, 0, samples),
            reference: { kind: 'cpu', name: 'x', p10: null, implVersion: 1 },
          },
        },
      }),
      'utf8',
    );
    expect(await loadBaseline(rawPath)).toBeNull();
  });

  it('負の標本を持つ baseline は読まない', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    // 経過時間として成立しない。 通すと p10 が負になり、 変化率の分母が負になって
    // 悪化が improved として報告される。
    writeFileSync(
      baselinePath,
      JSON.stringify({
        schema: 2,
        env: captureEnv(),
        results: { 'op.serial': buildMeasureResult('op.serial', 3, 0, [-1, 1, 1]) },
      }),
      'utf8',
    );
    expect(await loadBaseline(baselinePath)).toBeNull();
  });
});

describe('createReferenceOps — 基準 op の一式', () => {
  it('fs 系を要求した時だけ temp dir を掘り、 dispose で消す', () => {
    const references = createReferenceOps();
    try {
      // cpu だけなら fs に触れないので dir を掘らない。
      const cpu = references.get('cpu');
      expect(cpu.kind).toBe('cpu');
      expect(cpu.implVersion).toBe(REFERENCE_IMPL_VERSION);

      const read = references.get('fs-read');
      const write = references.get('fs-write');
      expect(read.name).toBe('harness.reference.fs-read');
      expect(write.name).toBe('harness.reference.fs-write');

      // 同じ種類を 2 度要求しても同じ op を返す (dir を増やさない)。
      expect(references.get('fs-read')).toBe(read);
    } finally {
      references.dispose();
    }
  });

  it('dispose が temp dir を実際に削除する', async () => {
    const references = createReferenceOps();
    const reference = references.get('fs-write');
    await reference.fn();
    // 基準が書いた file の親 dir を掴む。 dispose 後に消えていることを見る。
    const dirs = readdirSync(os.tmpdir()).filter((entry) =>
      entry.startsWith('kiwa-perf-reference-'),
    );
    expect(dirs.length).toBeGreaterThan(0);
    references.dispose();
    const after = readdirSync(os.tmpdir()).filter((entry) =>
      entry.startsWith('kiwa-perf-reference-'),
    );
    expect(after.length).toBeLessThan(dirs.length);
  });

  it('未知の種類は既知の基準に落とさず落とす', () => {
    const references = createReferenceOps();
    try {
      // 落とすと、 その名前で baseline に記録され、 次の実行が「同じ種類」 と
      // 判定して別物どうしの比を比べる。
      expect(() => references.get('gpu' as PerfReferenceKind)).toThrow(/未知の基準 op の種類/);
    } finally {
      references.dispose();
    }
  });
});
