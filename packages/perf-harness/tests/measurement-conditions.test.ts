import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { runPerf3Layer } from '../src/index.js';

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
