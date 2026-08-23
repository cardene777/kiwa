import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import {
  BASELINE_SCHEMA,
  buildMeasureResult,
  captureEnv,
  loadBaselineSnapshot,
  measureConcurrent,
  resolveBaselineRoot,
  resolveKiwaRepoRoot,
  saveBaselineEnvelope,
} from '../src/index.js';
import { runPerf3LayerLive } from '../src/live.js';
import type { BaselineEnvelope } from '../src/types.js';

/**
 * 失敗経路と既定外の入口をまとめて通す。
 *
 * ここに集めた経路は「起きた時にだけ通る」 ため、 通常の測定 test では一度も
 * 実行されない。 実行されないまま置くと、 例えば baseline の書込が途中で落ちた時に
 * 一時 file が残る (次の実行が別 worker の残骸を読む) といった壊れ方に気付けない。
 *
 * 実 service は使わない。 fs は実 filesystem の一時 dir だけを触り、 live 経路は
 * env 欠落で必ず飛ばす形にして実 API を叩かせない。
 */

const created: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(os.tmpdir(), 'perf-harness-edge-'));
  created.push(dir);
  return dir;
}

afterEach(() => {
  while (created.length > 0) {
    const dir = created.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

/** 保存できる最小の envelope。 標本 2 件は saveBaselineEnvelope の下限。 */
function envelope(): BaselineEnvelope {
  return {
    schema: BASELINE_SCHEMA,
    env: captureEnv(),
    results: { 'op.serial': buildMeasureResult('op.serial', 2, 0, [1, 2]) },
  };
}

describe('measureConcurrent — 引数の検証', () => {
  it('T-PH-C-001 負の warmup を測る前に弾く', async () => {
    // 負の warmup は worker 側の for が 0 回で回るだけなので、 弾かないと
    // 「暖機した」 記録が warmup = 負数のまま baseline に載る。
    await expect(
      measureConcurrent({
        name: 'bad-warmup',
        fn: () => {},
        concurrency: 1,
        iterationsPerWorker: 1,
        warmup: -1,
      }),
    ).rejects.toThrow('measureConcurrent: warmup must be >= 0');
  });
});

describe('runPerf3LayerLive — 全 op が env 欠落で飛んだ実行', () => {
  it('T-PH-L-001 1 件も測れなかった実行は report にその旨を書く', async () => {
    const dir = tempDir();
    const reportPath = join(dir, 'report.md');
    // 実在しない env 名を要求させる = credential を持たない環境と同じ状態を作る。
    // これにより実 API へは 1 度も出ない。
    const requiredEnv = ['KIWA_PERF_HARNESS_ABSENT_ENV_FOR_TEST'];
    const envName = requiredEnv[0] as string;
    const hadOriginal = Object.prototype.hasOwnProperty.call(process.env, envName);
    const original = process.env[envName];
    delete process.env[envName];
    expect(process.env[requiredEnv[0] as string]).toBeUndefined();
    try {
      const result = await runPerf3LayerLive({
        moduleName: 'edge-live',
        ops: [{ name: 'alpha', fn: () => {}, serialP95CapMs: 1000, requiredEnv }],
        reportPath,
        baselinePath: join(dir, 'baseline.json'),
        serialIterations: 2,
        serialWarmup: 0,
      });

      expect(result.anySkipped).toBe(true);
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]?.skipped).toBe(true);
      expect(result.outcomes[0]?.skipReason).toContain('LIVE_ENV_MISSING');
      // 測っていない実行が「上限内で通った」 と読めてはいけない。 report 本文に
      // 測定が 0 件だったことが出ることを固定する。
      const report = readFileSync(reportPath, 'utf8');
      expect(report).toContain('No live ops ran this pass');
      // 測っていないので baseline も作らない。
      expect(result.baselineSeeded).toBe(false);
      expect(existsSync(join(dir, 'baseline.json'))).toBe(false);
    } finally {
      if (hadOriginal && original !== undefined) process.env[envName] = original;
      else delete process.env[envName];
    }
  });
});

describe('resolveKiwaRepoRoot', () => {
  it('T-PH-TL-001 起点から上に辿って kiwa-monorepo の package.json を持つ dir を返す', () => {
    const root = resolveKiwaRepoRoot(process.cwd());

    // 返った dir が本当に monorepo の root であることを、 名前を読み直して確かめる。
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      name?: string;
    };
    expect(manifest.name).toBe('kiwa-monorepo');
  });

  it('T-PH-TL-002 別名の package.json は素通りし、 root まで見つからなければ投げる', () => {
    const dir = tempDir();
    // 名前違いの package.json を置く。 存在するだけで返してしまうと、 perf report が
    // 無関係な dir に書かれる。
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'not-kiwa-monorepo' }), 'utf8');

    expect(() => resolveKiwaRepoRoot(dir)).toThrow(`Could not resolve repo root from ${dir}`);
  });
});

describe('resolveBaselineRoot — 実在しない起点', () => {
  it('T-PH-B-016 realpath できない path でも resolve した絶対 path を返す', () => {
    const missing = join(os.tmpdir(), 'perf-harness-absent-root-xyz', 'nested', 'deeper');
    expect(existsSync(missing)).toBe(false);

    const root = resolveBaselineRoot(missing);

    // 解けなくても例外にせず絶対 path を返す。 ここで投げると、 baseline を
    // まだ作っていない実行が置き場を決められず測定そのものが始まらない。
    expect(typeof root).toBe('string');
    expect(isAbsolute(root)).toBe(true);
  });
});

describe('baseline の fs 失敗経路', () => {
  it('T-PH-B-017 読めない (ENOENT でない) baseline は握り潰さず投げる', async () => {
    const dir = tempDir();
    // dir を baseline path として渡すと readFile は EISDIR で落ちる。 これを
    // 「file が無い」 と同じに扱うと、 壊れた置き場のまま seed し直しが延々続く。
    await expect(loadBaselineSnapshot(dir)).rejects.toThrow();
  });

  it('T-PH-B-018 版の照合で読めない baseline も投げる', async () => {
    const dir = tempDir();
    // expectedRevision を渡した時だけ通る読み直しの経路。 EISDIR を null
    // (= file が無い) と読むと、 照合が通って既存を上書きしてしまう。
    await expect(
      saveBaselineEnvelope(dir, envelope(), { expectedRevision: null }),
    ).rejects.toThrow();
  });

  it('T-PH-B-019 書込に失敗したら一時 file を残さず投げ直す', async () => {
    const parent = tempDir();
    // rename 先を dir にすると rename が必ず落ちる = 書込途中で落ちた実行と同じ状態。
    const target = join(parent, 'baseline-as-dir');
    mkdirSync(target);
    writeFileSync(join(target, 'keep.txt'), 'x', 'utf8');

    await expect(saveBaselineEnvelope(target, envelope())).rejects.toThrow();

    // 一時 file が残ると、 次の実行が別 worker の書きかけを拾う余地ができる。
    // 片付けが例外の前に走ることを、 親 dir に .tmp が無いことで確かめる。
    const leftovers = readdirSync(dirname(target)).filter((name) => name.endsWith('.tmp'));
    expect(leftovers).toEqual([]);
  });
});
