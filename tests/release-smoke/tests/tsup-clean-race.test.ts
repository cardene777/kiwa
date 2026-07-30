import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 共有依存の tsup 設定に `clean: true` が戻っていないことを固定する (#1741)。
 *
 * 169 package が自身の `test` script の中で `pnpm -F <name> build` を実行して
 * 共有依存を再 build する。 `pnpm -r test` は package を並列に走らせるため、
 * その再 build と、 別 package の `tsc` が同じ `dist/` を読む瞬間が重なる。
 *
 * `clean: true` は build のたびに `dist/` を空にするので、 重なった側は型定義を
 * 解決できず落ちる。 実測では `packages/api` が `TS7016` を起点に 12 件の型エラーで
 * 落ち、 単体実行では 90/90 通った。
 *
 * clean を外すと `dist/` が空になる瞬間が消える。 対象は「出力 file の集合が固定
 * されている package」 に限る = entry が 1 つで chunk が出ないもの。 entry を増やして
 * hash 名の chunk が出る構成では、 clean を外すと古い chunk が残るため対象外。
 */

// compile 後は `.vitest-dist/tests/` から走るため 4 階層上が repo root
// (`.vitest-dist/tests` → `.vitest-dist` → `release-smoke` → `tests` → root)。
// 既存 test (`perf-serial-execution.test.ts`) と同じ数え方。
const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

/** tsup が単一 entry で出す file の集合。 これ以外が出るなら clean を外せない。 */
const FIXED_OUTPUT = new Set([
  'index.cjs',
  'index.cjs.map',
  'index.d.cts',
  'index.d.ts',
  'index.js',
  'index.js.map',
]);

/** 他 package の `test` / `pretest` から build される package 名を集める。 */
function collectSharedBuildTargets(): Set<string> {
  const targets = new Set<string>();
  for (const root of ['packages', 'examples', 'tests']) {
    const dir = join(REPO_ROOT, root);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      const manifest = join(dir, entry, 'package.json');
      if (!existsSync(manifest)) continue;
      const scripts = (JSON.parse(readFileSync(manifest, 'utf8')) as {
        scripts?: Record<string, string>;
      }).scripts;
      if (scripts === undefined) continue;
      for (const key of ['pretest', 'test']) {
        const script = scripts[key];
        if (script === undefined) continue;
        for (const match of script.matchAll(/(?:-F|--filter) (@kiwa-lab\/[a-z0-9-]+)/g)) {
          targets.add(match[1]!.replace('@kiwa-lab/', ''));
        }
      }
    }
  }
  return targets;
}

function hasCleanTrue(name: string): boolean | null {
  const config = join(PACKAGES_DIR, name, 'tsup.config.ts');
  if (!existsSync(config)) return null;
  // block comment を落としてから見る。 外した理由を comment に書くと、 その本文に
  // `clean: true` の字面が入って設定と区別が付かなくなる (実際に誤検知した)。
  const source = readFileSync(config, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return /^\s*clean:\s*true/m.test(source);
}

/** dist の中身が固定 6 file だけか。 dist 未 build の package は判定不能で null。 */
function hasFixedOutput(name: string): boolean | null {
  const dist = join(PACKAGES_DIR, name, 'dist');
  if (!existsSync(dist)) return null;
  return readdirSync(dist).every((file) => FIXED_OUTPUT.has(file));
}

describe('tsup clean と並列 test の race (#1741)', () => {
  const targets = [...collectSharedBuildTargets()].sort();

  it('他 package の test から build される package が実在する', () => {
    // この前提が消えたら本 test の意味も消える。 その時は test ごと畳む。
    expect(targets.length).toBeGreaterThan(10);
  });

  it('出力が固定の共有依存に clean: true が戻っていない', () => {
    const offenders: string[] = [];
    for (const name of targets) {
      const clean = hasCleanTrue(name);
      const fixed = hasFixedOutput(name);
      // config が無い / dist が未 build の package は判定しない。
      if (clean === null || fixed === null) continue;
      // chunk が出る構成では clean を外すと古い chunk が残るため対象外。
      if (!fixed) continue;
      if (clean) offenders.push(name);
    }
    expect(
      offenders,
      `clean: true があると build 中に dist が空になり、並列実行中の別 package が型定義を解決できない (#1741)。` +
        ` 該当: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('chunk を出す package は対象外として clean を残している', () => {
    // 対象外の判定が「たまたま全部 clean なし」 で成立していないことを確かめる。
    // 1 件でも「chunk あり かつ clean あり」 が実在すれば、 上の test の
    // 除外条件が意味を持っていると言える。
    const excluded = targets.filter((name) => hasFixedOutput(name) === false);
    expect(excluded.length).toBeGreaterThan(0);
    expect(excluded.some((name) => hasCleanTrue(name) === true)).toBe(true);
  });
});
