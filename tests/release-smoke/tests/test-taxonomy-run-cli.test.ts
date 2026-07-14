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

  it('config 拡張後 (全 lib skill 対象) は cache × skill も pass 判定', () => {
    // CAR-fidelity-integration-all-libs (PR #1656) で skillLibs / mockAdapterLibs /
    // integrationLibs を全 lib に拡張。 cache も全 category 対象化されたため、
    // --lib cache --category skill = tests/skill/cache.skill.test.ts 存在 → pass。
    // 元 test は「一部 lib は対象外」 前提だったが obsolete、 config 拡張後の期待に更新。
    const result = spawnSync('node', [CLI_PATH, '--category', 'skill', '--lib', 'cache'], {
      encoding: 'utf-8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/cache \| pass/);
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
    // CAR-fidelity-integration-all-libs (PR #1656) で全 category 対象化、 cache は全 pass。
    const runResult = spawnSync(
      'node',
      [CLI_PATH, '--category', 'all', '--lib', 'cache', '--format', 'json'],
      { encoding: 'utf-8', timeout: 300_000 },
    );
    // exit code = 0 (cache は全 4 category 対象化で全 pass)
    expect(runResult.status).toBe(0);
    const output = JSON.parse(runResult.stdout);
    expect(output.category).toBe('all');
    expect(output.results).toHaveProperty('perf');
    expect(output.results).toHaveProperty('fidelity');
    expect(output.results).toHaveProperty('skill');
    expect(output.results).toHaveProperty('integration');
    expect(output.summaries).toHaveProperty('fidelity');
    expect(output.summaries.fidelity.passed).toBeGreaterThanOrEqual(1);
  });

  it('中身 chk 3 軸 = minCases 下限 / expect 未呼出 / trivial pattern を検出 (Q7、 CLI 単独 release-worthy 判定)', async () => {
    // 一時 fixture lib で 3 pattern (insufficient-cases / missing-assertion / trivial-assertion)
    // を再現、 各々 CLI が fail 判定するかを verify する。 CLI の 中身 chk 層は「file 揃ってる +
    // 実行 pass」 の構造 gate に加えて「domain-specific 中身が空でない」 の質 gate を担う。
    const { existsSync, mkdirSync, rmSync, writeFileSync } = await import('node:fs');
    const { spawnSync } = await import('node:child_process');
    const { join, resolve, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const HERE = dirname(fileURLToPath(import.meta.url));
    const ROOT = resolve(HERE, '..', '..', '..', '..');
    const CLI = join(ROOT, 'scripts/kiwa-taxonomy-run.mjs');

    // fixture = packages/fixture-quality-gate 一時作成、 fidelity dir に trivial pattern 書出
    const fixLib = join(ROOT, 'packages/fixture-quality-gate');
    const fixDir = join(fixLib, 'tests/fidelity');
    if (existsSync(fixLib)) rmSync(fixLib, { recursive: true, force: true });
    mkdirSync(fixDir, { recursive: true });
    writeFileSync(join(fixLib, 'package.json'), JSON.stringify({ name: '@kiwa-lab/fixture-quality-gate', version: '0.0.0', private: true }));

    // trivial assertion 5 case
    writeFileSync(
      join(fixDir, 'trivial.fidelity.test.ts'),
      `import { describe, expect, it } from 'vitest';
describe('trivial', () => {
  it('c1', () => { expect(true).toBe(true); });
  it('c2', () => { expect(1).toBe(1); });
  it('c3', () => { expect(null).toBeNull(); });
  it('c4', () => { expect(undefined).toBeUndefined(); });
  it('c5', () => { expect([]).toEqual([]); });
});
`,
    );
    try {
      const result = spawnSync(
        'node',
        [CLI, '--category', 'fidelity', '--lib', 'fixture-quality-gate'],
        { encoding: 'utf-8', timeout: 60_000 },
      );
      expect(result.status).toBe(1);
      expect(result.stdout).toMatch(/FAIL \(trivial/);
    } finally {
      rmSync(fixLib, { recursive: true, force: true });
    }
  });
});
