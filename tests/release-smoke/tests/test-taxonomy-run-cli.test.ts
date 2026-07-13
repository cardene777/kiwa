// Q5 = test-taxonomy 分類別実行 chk CLI (scripts/kiwa-taxonomy-run.mjs) の存在 + 起動 shape 確認。
//
// SSOT = docs/concepts/test-taxonomy.md § 5 分類、 CLI = scripts/kiwa-taxonomy-run.mjs。
//
// meta lint (存在 chk) + CLI (実行 chk) の 2 軸で test-taxonomy meta 経路が完成する。
// 本 test は CLI 自体が (1) 実在する (2) --help で正常応答 (3) 未知 category で fail する
// の 3 shape を release-smoke 経路で verify する (CLI 本体の実 run は per-category に
// 委ね、 release-smoke は CLI 存在 + 引数 parse 動作を担保する薄い gate)。

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..');
const CLI_PATH = join(ROOT, 'scripts/kiwa-taxonomy-run.mjs');

describe('Q5 test-taxonomy CLI shape', () => {
  it('CLI file が実在する', () => {
    expect(existsSync(CLI_PATH)).toBe(true);
  });

  it('--help で Usage 出力 + exit 0', () => {
    const result = spawnSync('node', [CLI_PATH, '--help'], { encoding: 'utf-8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Usage/);
    expect(result.stdout).toMatch(/--category/);
    expect(result.stdout).toMatch(/perf/);
    expect(result.stdout).toMatch(/fidelity/);
    expect(result.stdout).toMatch(/skill/);
    expect(result.stdout).toMatch(/integration/);
  });

  it('引数なし = help 表示 + exit 1', () => {
    const result = spawnSync('node', [CLI_PATH], { encoding: 'utf-8' });
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/Usage/);
  });

  it('未知 category = stderr にエラー + exit 1', () => {
    const result = spawnSync('node', [CLI_PATH, '--category', 'unknown-cat'], { encoding: 'utf-8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/invalid --category/);
  });

  it('--help 出力に --include-real flag 説明が含まれる (Q6-5)', () => {
    const result = spawnSync('node', [CLI_PATH, '--help'], { encoding: 'utf-8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/--include-real/);
    expect(result.stdout).toMatch(/KIWA_MODE=real/);
  });

  it('config 記載外 lib × category で file 不在 = exit 1 (揃ってる chk 完全性、 Q5 bug fix)', () => {
    // cache は skill 対象外 lib (config requireSkill.skillLibs に含まれない)、
    // --lib cache --category skill = tests/skill dir 不在 → no-files → fail 判定 → exit 1
    // CLI の目的は「揃ってる + 実行 pass」 の完全 chk、 file 不在は必ず fail に落ちる。
    const result = spawnSync('node', [CLI_PATH, '--category', 'skill', '--lib', 'cache'], {
      encoding: 'utf-8',
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/FAIL \(no-files\)/);
  });

  it('.ts + .tsx 両拡張子を accept する (ui × perf = ui.perf.tsx を pass 判定)', () => {
    // collectFiles で .ts のみ match だと ui.perf.tsx (JSX 含む component perf test) が
    // no-files 判定されて false-fail する bug fix。 meta lint 側 (test-taxonomy-existence.test.ts)
    // は既に .ts + .tsx 両 accept、 CLI 側も整合させる SSOT。
    const result = spawnSync('node', [CLI_PATH, '--category', 'perf', '--lib', 'ui'], {
      encoding: 'utf-8',
      timeout: 120_000,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/ui \| pass/);
  });

  it('--category all で 4 分類統合 matrix 出力', () => {
    // 実 vitest 起動は時間かかるので、 --help 経路で all support を確認する軽量 verify、
    // + --format json で単一 lib 実 run して all 挙動 shape を確認する。
    const helpResult = spawnSync('node', [CLI_PATH, '--help'], { encoding: 'utf-8' });
    expect(helpResult.stdout).toMatch(/perf\|fidelity\|skill\|integration\|all/);
    expect(helpResult.stdout).toMatch(/--category all/);

    // 実 all run は cache のみ scope (--lib cache) で軽量確認、 all 出力 matrix + 4 分類の
    // summary per category が出力される shape を検証。
    const runResult = spawnSync(
      'node',
      [CLI_PATH, '--category', 'all', '--lib', 'cache', '--format', 'json'],
      { encoding: 'utf-8', timeout: 300_000 },
    );
    // exit code = 1 (cache は skill/integration 対象外 で no-files fail が発生する)
    expect(runResult.status).toBe(1);
    const output = JSON.parse(runResult.stdout);
    expect(output.category).toBe('all');
    expect(output.results).toHaveProperty('perf');
    expect(output.results).toHaveProperty('fidelity');
    expect(output.results).toHaveProperty('skill');
    expect(output.results).toHaveProperty('integration');
    expect(output.summaries).toHaveProperty('fidelity');
    expect(output.summaries.fidelity.passed).toBeGreaterThanOrEqual(1);  // cache fidelity pass
  });
});
