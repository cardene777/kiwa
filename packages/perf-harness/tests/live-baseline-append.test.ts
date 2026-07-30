import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { runPerf3LayerLive } from '../src/live.js';
import { planBaselineWrite, uncomparableVerdict } from '../src/baseline-write.js';
import { BASELINE_SCHEMA, captureEnv } from '../src/baseline.js';
import { buildMeasureResult, runPerf3Layer } from '../src/index.js';
import type { MeasureResult } from '../src/types.js';

/**
 * #1740 — live 経路が既存 baseline に新しく測った op を追記しない問題。
 *
 * 保存条件が「記録が 1 件も無い時だけ全件書く」 だったため、 op を 1 つ足すと
 * その op は永久に回帰判定に載らなかった。 mock 経路の追記と同じ helper を
 * 共有する形に直したので、 両経路が同じ条件で書くことを固定する。
 */

const created: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(os.tmpdir(), 'perf-harness-live-'));
  created.push(dir);
  return dir;
}

afterEach(() => {
  while (created.length > 0) {
    const dir = created.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

/** live op の最小形。 env 要求なしで必ず測れる。 */
function op(name: string) {
  return { name, fn: () => {}, serialP95CapMs: 1000, requiredEnv: [] };
}

function readResults(path: string): Record<string, MeasureResult> {
  return JSON.parse(readFileSync(path, 'utf8')).results as Record<string, MeasureResult>;
}

describe('runPerf3LayerLive — baseline の追記 (#1740)', () => {
  it('記録の無い op を既存 baseline に足す', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'baseline.json');

    const first = await runPerf3LayerLive({
      moduleName: 'live-append',
      ops: [op('alpha')],
      reportPath: join(dir, 'first.md'),
      baselinePath,
    });
    expect(first.baselineSeeded).toBe(true);
    expect(Object.keys(readResults(baselinePath)).sort()).toEqual([
      'alpha.live.concurrent',
      'alpha.live.serial',
    ]);

    // op を 1 件足す。 直す前はここで 1 byte も書かれなかった。
    await runPerf3LayerLive({
      moduleName: 'live-append',
      ops: [op('alpha'), op('beta')],
      reportPath: join(dir, 'second.md'),
      baselinePath,
    });
    expect(Object.keys(readResults(baselinePath)).sort()).toEqual([
      'alpha.live.concurrent',
      'alpha.live.serial',
      'beta.live.concurrent',
      'beta.live.serial',
    ]);
  });

  it('足した op が次の実行から回帰判定に載る', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'baseline.json');
    const common = { moduleName: 'live-verdict', baselinePath };

    await runPerf3LayerLive({ ...common, ops: [op('alpha')], reportPath: join(dir, '1.md') });
    const second = await runPerf3LayerLive({
      ...common,
      ops: [op('alpha'), op('beta')],
      reportPath: join(dir, '2.md'),
    });
    // 2 回目の beta はまだ記録が無いので比較できない。
    expect(second.outcomes.find((o) => o.name === 'beta')?.regressionVerdict).toBe(
      'n/a (baseline seeded)',
    );

    const third = await runPerf3LayerLive({
      ...common,
      ops: [op('alpha'), op('beta')],
      reportPath: join(dir, '3.md'),
    });
    // 3 回目は追記済なので判定が出る。 直す前はここも n/a のままだった。
    expect(third.outcomes.find((o) => o.name === 'beta')?.regressionVerdict).toMatch(
      /^(stable|improved|regressed)$/,
    );
  });

  it('既存 op の値は追記で入れ替わらない', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'baseline.json');
    const common = { moduleName: 'live-retain', baselinePath };

    await runPerf3LayerLive({ ...common, ops: [op('alpha')], reportPath: join(dir, '1.md') });
    const before = readResults(baselinePath)['alpha.live.serial']!;

    await runPerf3LayerLive({
      ...common,
      ops: [op('alpha'), op('beta')],
      reportPath: join(dir, '2.md'),
    });
    const after = readResults(baselinePath)['alpha.live.serial']!;
    // 毎回入れ替えると比較対象が動き続けて回帰を検出できない。
    expect(after.p10).toBe(before.p10);
    expect(after.samples).toEqual(before.samples);
  });

  it('測っていない op を掃除しない (env 欠落で飛ばした op を巻き込まない)', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'baseline.json');
    const common = { moduleName: 'live-prune', baselinePath };

    await runPerf3LayerLive({
      ...common,
      ops: [op('alpha'), op('beta')],
      reportPath: join(dir, '1.md'),
    });

    // beta が credential 欠落で飛ぶ実行。 gamma を足して書込を起こす。
    const second = await runPerf3LayerLive({
      ...common,
      ops: [
        op('alpha'),
        { ...op('beta'), requiredEnv: ['KIWA_LIVE_TEST_ABSENT_KEY'] },
        op('gamma'),
      ],
      reportPath: join(dir, '2.md'),
    });
    expect(second.anySkipped).toBe(true);
    // 飛ばした beta の記録が消えると、 credential を外した実行が他の op の
    // 比較対象を壊す。
    expect(Object.keys(readResults(baselinePath))).toContain('beta.live.serial');
  });

  it('上限を割った実行では書かず、 report にその旨を出す', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'baseline.json');
    const reportPath = join(dir, 'report.md');

    const result = await runPerf3LayerLive({
      moduleName: 'live-fail',
      // 上限 0ms は必ず割る。
      ops: [{ name: 'alpha', fn: () => {}, serialP95CapMs: 0, requiredEnv: [] }],
      reportPath,
      baselinePath,
    });
    expect(result.allPassed).toBe(false);
    expect(result.baselineSeeded).toBe(false);
    // 「seeded」 と書くと次回から比較されると読めるが、 上限違反が直るまで
    // 同じ状態が続く。
    expect(result.outcomes[0]!.regressionVerdict).toBe('n/a (baseline 未保存)');
    const report = readFileSync(reportPath, 'utf8');
    expect(report).toContain('この実行では baseline を書いていない');
  });

  it('前提が違う baseline は作り直す', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'baseline.json');
    const env = captureEnv();
    // 測定の前提が違う世代を置く。 直す前はこの状態から永久に書き直されなかった。
    writeFileSync(
      baselinePath,
      JSON.stringify({
        schema: BASELINE_SCHEMA,
        env: { ...env, measurementPremise: (env.measurementPremise ?? 0) - 1 },
        results: { 'alpha.live.serial': buildMeasureResult('alpha.live.serial', 3, 0, [1, 1, 1]) },
      }),
      'utf8',
    );

    const result = await runPerf3LayerLive({
      moduleName: 'live-reseed',
      ops: [op('alpha')],
      reportPath: join(dir, 'report.md'),
      baselinePath,
    });
    expect(result.baselineSeeded).toBe(true);
    const saved = JSON.parse(readFileSync(baselinePath, 'utf8'));
    expect(saved.env.measurementPremise).toBe(env.measurementPremise);
  });
});

describe('planBaselineWrite — 両経路で共有する書込の判断 (#1740)', () => {
  const alpha = buildMeasureResult('alpha', 3, 0, [1, 1, 1]);
  const beta = buildMeasureResult('beta', 3, 0, [2, 2, 2]);

  it('測定が成立していなければ追記も作り直しもしない', () => {
    for (const broken of [
      { premiseValid: false, hardGatePassed: true },
      { premiseValid: true, hardGatePassed: false },
    ]) {
      const plan = planBaselineWrite({
        prior: { alpha },
        current: { alpha, beta },
        prune: false,
        ...broken,
      });
      expect(plan.written, JSON.stringify(broken)).toBe(false);
      expect(plan.results).toEqual({});
    }
  });

  it('記録が全て揃っていれば書かない', () => {
    const plan = planBaselineWrite({
      prior: { alpha },
      current: { alpha },
      premiseValid: true,
      hardGatePassed: true,
      prune: false,
    });
    expect(plan.written).toBe(false);
  });

  it('記録を採らなかった時は今回の値で全件を書く', () => {
    const plan = planBaselineWrite({
      prior: null,
      current: { alpha, beta },
      premiseValid: true,
      hardGatePassed: true,
      prune: true,
    });
    expect(plan.written).toBe(true);
    expect(plan.results).toEqual({ alpha, beta });
  });

  it('掃除は有効にした時だけ働く', () => {
    const stale = buildMeasureResult('gone', 3, 0, [9, 9, 9]);
    const withPrune = planBaselineWrite({
      prior: { alpha, gone: stale },
      current: { alpha },
      premiseValid: true,
      hardGatePassed: true,
      prune: true,
    });
    expect(withPrune.written).toBe(true);
    expect(Object.keys(withPrune.results)).toEqual(['alpha']);

    const withoutPrune = planBaselineWrite({
      prior: { alpha, gone: stale },
      current: { alpha },
      premiseValid: true,
      hardGatePassed: true,
      prune: false,
    });
    expect(withoutPrune.written).toBe(false);
  });

  it('書き直しが要ると宣言された op は記録があっても入れ替える', () => {
    const updated = buildMeasureResult('alpha', 3, 0, [5, 5, 5]);
    const plan = planBaselineWrite({
      prior: { alpha },
      current: { alpha: updated },
      premiseValid: true,
      hardGatePassed: true,
      prune: false,
      needsRefresh: () => true,
    });
    expect(plan.written).toBe(true);
    expect(plan.results['alpha']).toEqual(updated);
  });

  it('宣言しなければ記録のある op は触らない', () => {
    const updated = buildMeasureResult('alpha', 3, 0, [5, 5, 5]);
    const plan = planBaselineWrite({
      prior: { alpha },
      current: { alpha: updated, beta },
      premiseValid: true,
      hardGatePassed: true,
      prune: false,
    });
    expect(plan.results['alpha']).toEqual(alpha);
    expect(plan.results['beta']).toEqual(beta);
  });
});

describe('runPerf3Layer — mock 経路も同じ verdict を出す (#1740)', () => {
  it('書けなかった実行の未記録 op は seeded と書かない', async () => {
    const dir = tempDir();
    const result = await runPerf3Layer({
      moduleName: 'mock-unwritten',
      // 上限 0ms は必ず割るので書込が起きない。
      ops: [{ name: 'alpha', fn: () => {}, serialP95CapMs: 0 }],
      reportPath: join(dir, 'report.md'),
      baselinePath: join(dir, 'baseline.json'),
      serialIterations: 5,
      serialWarmup: 1,
      concurrency: 2,
      iterationsPerWorker: 2,
      memoryIterations: 5,
    });
    expect(result.baselineSeeded).toBe(false);
    expect(result.outcomes[0]!.regressionVerdict).toBe('n/a (baseline 未保存)');
  });

  it('書けた実行の未記録 op は seeded と書く', async () => {
    const dir = tempDir();
    const result = await runPerf3Layer({
      moduleName: 'mock-written',
      ops: [{ name: 'alpha', fn: () => {}, serialP95CapMs: 1000 }],
      reportPath: join(dir, 'report.md'),
      baselinePath: join(dir, 'baseline.json'),
      serialIterations: 5,
      serialWarmup: 1,
      concurrency: 2,
      iterationsPerWorker: 2,
      memoryIterations: 5,
    });
    expect(result.baselineSeeded).toBe(true);
    expect(result.outcomes[0]!.regressionVerdict).toBe('n/a (baseline seeded)');
  });
});

describe('uncomparableVerdict — n/a の 3 種 (#1740)', () => {
  it('記録の有無と、 書けたかどうかで 3 通りに分かれる', () => {
    expect(uncomparableVerdict(false, true)).toBe('n/a (baseline seeded)');
    expect(uncomparableVerdict(false, false)).toBe('n/a (baseline 未保存)');
    // 記録がある op は、 書けたかどうかに関わらず「比較できなかった」。
    expect(uncomparableVerdict(true, true)).toBe('n/a (比較せず)');
    expect(uncomparableVerdict(true, false)).toBe('n/a (比較せず)');
  });
});
