import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { isAbsolute, join } from 'node:path';
import { buildMeasureResult, runPerf3Layer } from '../src/index.js';
import { runPerf3LayerLive } from '../src/live.js';
import { pruneManifestPath } from '../src/prune-manifest.js';
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

/**
 * #1730 — `KIWA_PERF_PRUNE_STALE=1` を export した shell から個別 package を実行すると、
 * 絞り込まれた op 一覧が「完全な一覧」 とみなされて記録が消えていた。 環境変数は
 * 子 process に継承されるため、 root の `test:perf` だけが立てるという前提が成り立たない。
 */
describe('環境変数を継承した実行が baseline を消さない (#1730)', () => {
  const originalFlag = process.env['KIWA_PERF_PRUNE_STALE'];
  const originalManifest = process.env['KIWA_PERF_PRUNE_MANIFEST'];

  afterEach(() => {
    if (originalFlag === undefined) delete process.env['KIWA_PERF_PRUNE_STALE'];
    else process.env['KIWA_PERF_PRUNE_STALE'] = originalFlag;
    if (originalManifest === undefined) delete process.env['KIWA_PERF_PRUNE_MANIFEST'];
    else process.env['KIWA_PERF_PRUNE_MANIFEST'] = originalManifest;
  });

  it('環境変数を立てた絞り込み実行でも記録が消えない', async () => {
    const dir = tempDir();
    const baselinePath = join(dir, 'inherit.json');
    process.env['KIWA_PERF_PRUNE_MANIFEST'] = join(dir, 'manifest.jsonl');

    // 全 op を測って記録を作る。
    await runPerf3Layer({
      ...baseInput(dir, 'inherit'),
      baselinePath,
      reportPath: join(dir, '1.md'),
      ops: [
        { name: 'alpha', fn: () => {}, serialP95CapMs: 1000 },
        { name: 'beta', fn: () => {}, serialP95CapMs: 1000 },
      ],
    });
    expect(Object.keys(readResults(baselinePath))).toContain('beta.serial');

    // export された環境変数を継承したまま、 alpha だけを測る絞り込み実行。
    // 直す前はここで beta の記録が消えていた。
    process.env['KIWA_PERF_PRUNE_STALE'] = '1';
    await runPerf3Layer({
      ...baseInput(dir, 'inherit'),
      baselinePath,
      reportPath: join(dir, '2.md'),
      ops: [{ name: 'alpha', fn: () => {}, serialP95CapMs: 1000 }],
    });

    expect(Object.keys(readResults(baselinePath))).toContain('beta.serial');
  });

  it('環境変数を立てた実行は manifest に測った op を残す', async () => {
    const dir = tempDir();
    const manifestPath = join(dir, 'manifest.jsonl');
    process.env['KIWA_PERF_PRUNE_MANIFEST'] = manifestPath;
    process.env['KIWA_PERF_PRUNE_STALE'] = '1';

    await runPerf3Layer({
      ...baseInput(dir, 'manifest'),
      baselinePath: join(dir, 'manifest-baseline.json'),
      reportPath: join(dir, '1.md'),
    });

    const records = readFileSync(manifestPath, 'utf8')
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as { baselinePath: string; keys: string[] });

    expect(records).toHaveLength(1);
    expect(records[0]!.keys).toContain('alpha.serial');
    expect(records[0]!.keys).toContain('alpha.concurrent');
  });

  /**
   * override を使う test だけだと、 置き場を導く経路が一度も走らない。
   * 実際の実行は override を使わないので、 そこが壊れていても test は通る。
   */
  describe('manifest の置き場 (override なし)', () => {
    it('絶対 path を返す', () => {
      // 相対 path を返すと package ごとの cwd 配下に書かれ、 repo root を見る
      // `--apply` が 1 件も拾えない = 掃除が一度も働かない。
      const target = pruneManifestPath('/repo/.perf-baseline/profile/vector.json');
      expect(isAbsolute(target)).toBe(true);
      expect(target).toBe(join('/repo', '.perf-baseline', '.prune-manifest.jsonl'));
    });

    it('profile が何段深くても `.perf-baseline` の直下に置く', () => {
      expect(pruneManifestPath('/repo/.perf-baseline/profile/saas/cache.json')).toBe(
        join('/repo', '.perf-baseline', '.prune-manifest.jsonl'),
      );
    });

    it('`.perf-baseline` を含まない path では baseline と同じ dir に置く', () => {
      const target = pruneManifestPath('/tmp/whatever/base.json');
      expect(isAbsolute(target)).toBe(true);
      expect(target).toBe(join('/tmp/whatever', '.prune-manifest.jsonl'));
    });

    it('相対 path を渡されても絶対 path に直す', () => {
      expect(isAbsolute(pruneManifestPath('rel/base.json'))).toBe(true);
    });

    it('相対の override は受け取らない', () => {
      // 書く側は package ごとの cwd で解決するため、相対値だと読む側と別 file を
      // 指す。manifest が package ごとに分裂し、掃除が黙って行われない。
      process.env['KIWA_PERF_PRUNE_MANIFEST'] = 'rel/manifest.jsonl';
      expect(() => pruneManifestPath('/repo/.perf-baseline/x.json')).toThrow(/絶対 path/);
    });
  });

  it('manifest を書けない実行は落ちる (握り潰さない)', async () => {
    const dir = tempDir();
    // 書けない場所を指す。1 実行ぶんの行が欠けた manifest は構文としては正常なので、
    // 握り潰すと掃除する側がそれを完全な一覧として読み、欠けた op を stale として
    // 消す = 「掃除されない」 ではなく「消しすぎる」 方に倒れる。
    process.env['KIWA_PERF_PRUNE_MANIFEST'] = join(dir, 'nested.jsonl', 'manifest.jsonl');
    process.env['KIWA_PERF_PRUNE_STALE'] = '1';
    writeFileSync(join(dir, 'nested.jsonl'), 'not a dir', 'utf8');

    await expect(
      runPerf3Layer({
        ...baseInput(dir, 'failwrite'),
        baselinePath: join(dir, 'failwrite.json'),
        reportPath: join(dir, '1.md'),
      }),
    ).rejects.toThrow();
  });

  it('環境変数が無ければ manifest を書かない', async () => {
    const dir = tempDir();
    const manifestPath = join(dir, 'manifest.jsonl');
    process.env['KIWA_PERF_PRUNE_MANIFEST'] = manifestPath;
    delete process.env['KIWA_PERF_PRUNE_STALE'];

    await runPerf3Layer({
      ...baseInput(dir, 'nomanifest'),
      baselinePath: join(dir, 'nomanifest.json'),
      reportPath: join(dir, '1.md'),
    });

    expect(existsSync(manifestPath)).toBe(false);
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
