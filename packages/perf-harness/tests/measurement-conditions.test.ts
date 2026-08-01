import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { buildMeasureResult, runPerf3Layer } from '../src/index.js';
import { runPerf3LayerLive } from '../src/live.js';
import { hasSameMeasurementConfig } from '../src/regression.js';
import type { MeasureResult } from '../src/types.js';

/**
 * #1730 — 測定条件が report と baseline から読めない問題。
 *
 * `MEASUREMENT_PREMISE` は global 定数で、 呼出ごとの設定 (反復数 / 空回し /
 * 並列度) を記録しない。 同じ版のまま条件を変えると、 旧条件の baseline と
 * 比較される。 また memory の空回しは測定区間の外で `fn` を呼ぶため、
 * 副作用を持つ op では「N 反復」 の見出しだけでは実際の呼出数が読めない。
 */

const created: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(os.tmpdir(), 'perf-harness-cond-'));
  created.push(dir);
  return dir;
}

afterEach(() => {
  while (created.length > 0) {
    const dir = created.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function readResults(path: string): Record<string, MeasureResult> {
  return JSON.parse(readFileSync(path, 'utf8')).results as Record<string, MeasureResult>;
}

/** 3 層を最小の反復数で回す。 測定条件そのものが対象なので値の質は問わない。 */
function baseInput(dir: string, name: string) {
  return {
    moduleName: name,
    reportPath: join(dir, `${name}.md`),
    baselinePath: join(dir, `${name}.json`),
    serialIterations: 5,
    serialWarmup: 1,
    concurrency: 2,
    iterationsPerWorker: 2,
    memoryIterations: 5,
    ops: [{ name: 'alpha', fn: () => {}, serialP95CapMs: 1000 }],
  };
}

describe('hasSameMeasurementConfig — 測定条件の一致判定 (#1730)', () => {
  const base = buildMeasureResult('alpha', 200, 5, [1, 1, 1]);

  it('反復数と空回しが同じなら一致', () => {
    expect(hasSameMeasurementConfig(buildMeasureResult('alpha', 200, 5, [2, 2, 2]), base)).toBe(
      true,
    );
  });

  it('反復数が違えば不一致', () => {
    expect(hasSameMeasurementConfig(buildMeasureResult('alpha', 100, 5, [1, 1, 1]), base)).toBe(
      false,
    );
  });

  it('空回しが違えば不一致', () => {
    expect(hasSameMeasurementConfig(buildMeasureResult('alpha', 200, 10, [1, 1, 1]), base)).toBe(
      false,
    );
  });
});

describe('測定条件を変えた baseline が比較対象から外れる (#1730)', () => {
  it('mock 経路 — 反復数を変えると比較せず、記録を入れ替える', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'mock.json');
    const common = { moduleName: 'cfg-mock', baselinePath };

    // 1 回目で記録を作り、2 回目で比較が成立することを確かめる。
    await runPerf3Layer({ ...baseInput(dir, 'cfg-mock'), ...common, reportPath: join(dir, '1.md') });
    const second = await runPerf3Layer({
      ...baseInput(dir, 'cfg-mock'),
      ...common,
      reportPath: join(dir, '2.md'),
    });
    expect(second.outcomes[0]!.regressionVerdict).toMatch(/^(stable|improved|regressed)$/);

    const before = readResults(baselinePath)['alpha.serial']!;
    expect(before.iterations).toBe(5);

    // 反復数を変えた実行は比較せず、記録を今回の条件で入れ替える。
    const third = await runPerf3Layer({
      ...baseInput(dir, 'cfg-mock'),
      ...common,
      reportPath: join(dir, '3.md'),
      serialIterations: 9,
    });
    expect(third.outcomes[0]!.regressionVerdict).toBe('n/a (比較せず)');

    const after = readResults(baselinePath)['alpha.serial']!;
    // 入れ替えないと key は既にあるので追記されず、条件を戻すまで永久に比較できない。
    expect(after.iterations).toBe(9);
  });

  it('mock 経路 — 比較しなかった理由が report から読める', async () => {
    const dir = tempDir();
    const common = { moduleName: 'cfg-reason', baselinePath: join(dir, 'reason.json') };

    await runPerf3Layer({
      ...baseInput(dir, 'cfg-reason'),
      ...common,
      reportPath: join(dir, '1.md'),
    });
    await runPerf3Layer({
      ...baseInput(dir, 'cfg-reason'),
      ...common,
      reportPath: join(dir, '2.md'),
      serialWarmup: 3,
    });

    const report = readFileSync(join(dir, '2.md'), 'utf8');
    // 基準 op を疑う文言を出すと、読み手は分母を調べて原因に辿り着けない。
    expect(report).toContain('測定条件が baseline と違うため比較せず');
    expect(report).toContain('空回し');
  });

  it('条件を戻すと次の実行から再び比較できる', async () => {
    const dir = tempDir();
    const common = { moduleName: 'cfg-back', baselinePath: join(dir, 'back.json') };

    await runPerf3Layer({ ...baseInput(dir, 'cfg-back'), ...common, reportPath: join(dir, '1.md') });
    // 条件を変えた実行が記録を入れ替える。
    await runPerf3Layer({
      ...baseInput(dir, 'cfg-back'),
      ...common,
      reportPath: join(dir, '2.md'),
      serialIterations: 9,
    });
    // 同じ条件で回せば比較が成立する。入れ替えが効いていないとここが n/a のまま。
    const third = await runPerf3Layer({
      ...baseInput(dir, 'cfg-back'),
      ...common,
      reportPath: join(dir, '3.md'),
      serialIterations: 9,
    });
    expect(third.outcomes[0]!.regressionVerdict).toMatch(/^(stable|improved|regressed)$/);
  });

  it('実 API 経路 — 反復数を変えると比較せず、記録を入れ替える', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'live.json');
    const common = {
      moduleName: 'cfg-live',
      baselinePath,
      ops: [{ name: 'alpha', fn: () => {}, serialP95CapMs: 1000, requiredEnv: [] }],
      serialIterations: 5,
      serialWarmup: 1,
      concurrency: 2,
      iterationsPerWorker: 2,
      memoryIterations: 5,
    };

    await runPerf3LayerLive({ ...common, reportPath: join(dir, '1.md') });
    const second = await runPerf3LayerLive({ ...common, reportPath: join(dir, '2.md') });
    expect(second.outcomes[0]!.regressionVerdict).toMatch(/^(stable|improved|regressed)$/);

    const third = await runPerf3LayerLive({
      ...common,
      reportPath: join(dir, '3.md'),
      serialIterations: 9,
    });
    expect(third.outcomes[0]!.regressionVerdict).toBe('n/a (比較せず)');
    expect(readResults(baselinePath)['alpha.live.serial']!.iterations).toBe(9);
  });
});

describe('memory の総呼出数が report から読める (#1730)', () => {
  it('空回しを入れた実行は総呼出数を内訳つきで出す', async () => {
    const dir = tempDir();
    await runPerf3Layer({ ...baseInput(dir, 'warm'), memoryWarmup: 4 });
    const report = readFileSync(join(dir, 'warm.md'), 'utf8');

    // 表の見出しに列があり、 行が「総数 (空回し + 反復)」 の形で出る。
    expect(report).toContain('呼出 (空回し + 反復)');
    expect(report).toContain('| 9 (4 + 5) |');
  });

  it('空回しなしの実行は反復数だけを出す', async () => {
    const dir = tempDir();
    await runPerf3Layer({ ...baseInput(dir, 'cold'), memoryWarmup: 0 });
    const report = readFileSync(join(dir, 'cold.md'), 'utf8');

    // 空回しが無い実行で `0 + 5 = 5` と書いても読み手に何も足さない。
    expect(report).toContain('| 5 |');
    expect(report).not.toContain('(0 + 5)');
  });

  it('同じ反復数でも空回しの有無で report の呼出数が変わる', async () => {
    const dir = tempDir();
    await runPerf3Layer({ ...baseInput(dir, 'a'), memoryWarmup: 0 });
    await runPerf3Layer({ ...baseInput(dir, 'b'), memoryWarmup: 6 });

    const withoutWarmup = readFileSync(join(dir, 'a.md'), 'utf8');
    const withWarmup = readFileSync(join(dir, 'b.md'), 'utf8');

    // 反復数 (memoryIterations = 5) は同じ。 実際に呼んだ回数が違うことが
    // report から読めないと、 副作用を持つ op で何を測ったのか判別できない。
    expect(withoutWarmup).toContain('| 5 |');
    expect(withWarmup).toContain('| 11 (6 + 5) |');
  });
});
