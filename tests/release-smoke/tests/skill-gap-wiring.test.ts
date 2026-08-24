// 共通 skill (/kiwa-gap / /kiwa-loop / /kiwa-verdict) が実在し、test を生成する skill が
// そこへ配線されていることを検査する (Issue #2193)。
//
// **散文だけの規約は守られていないことすら分からない**。 Issue #2184 で `kiwa-vitest` の
// threshold が 80% で止まっていたのは、同じ file の Step 5 に「production target 100%」 と
// 書いてあったのに完了条件が 80% だったから = 完了条件が gate で、Step の記述は読まれるだけ
// だった。 だから完了条件の側を機械で見る。
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SKILLS_DIR = resolve(REPO_ROOT, '.claude/skills');

/** 共通 skill 3 つ。 責務が 1 対 1 で分かれていることが設計の芯。 */
const COMMON_SKILLS = ['kiwa-gap', 'kiwa-loop', 'kiwa-verdict'] as const;

function read(skill: string): string {
  return readFileSync(resolve(SKILLS_DIR, skill, 'SKILL.md'), 'utf8');
}

/** `## 完了条件` の本文だけを取り出す。 */
function completion(src: string): string {
  const m = /^## 完了条件\n([\s\S]*?)(?=^## |\Z)/m.exec(src);
  return m?.[1] ?? '';
}

/**
 * test を生成する skill。
 *
 * 一覧を人手で持たず **実物から導く**。 `## 既存 test の再利用` を持つことが
 * 「test を生成する skill」 の定義で、`kiwa-design/references/existing-test-reuse.md` が
 * その契約の SSOT になっている。 一覧を literal で書くと skill が増えた時に取り残される
 * (`rules/quality.md § 導出可能記述は人手で書かない`)。
 */
function generatorSkills(): string[] {
  return readdirSync(SKILLS_DIR)
    .filter((name) => {
      const p = resolve(SKILLS_DIR, name, 'SKILL.md');
      if (!existsSync(p) || !statSync(resolve(SKILLS_DIR, name)).isDirectory()) return false;
      return /^## 既存 test の再利用$/m.test(readFileSync(p, 'utf8'));
    })
    .sort();
}

describe('共通 skill が実在する', () => {
  it('T-SKG-001 3 skill の SKILL.md がある', () => {
    for (const s of COMMON_SKILLS) {
      expect(existsSync(resolve(SKILLS_DIR, s, 'SKILL.md')), `${s} が無い`).toBe(true);
    }
  });

  it('T-SKG-002 /kiwa-loop が停止条件 3 つを持つ', () => {
    // 停止条件が欠けると「回せば進む」 前提で無限に回る。 3 つとも要る。
    const src = read('kiwa-loop');
    expect(src).toMatch(/未達 0 件/);
    expect(src).toMatch(/改善 0 が \*\*2 round 連続\*\*|改善 0 が 2 round 連続/);
    expect(src).toMatch(/上限 \(既定 5\)|round が上限/);
  });

  it('T-SKG-003 /kiwa-verdict が 4 分類を持つ', () => {
    const src = read('kiwa-verdict');
    for (const label of [
      '別の gate が覆っている',
      '実装が到達不能',
      '入力を組めない',
      '単に書いていない',
    ]) {
      expect(src, `分類「${label}」 が無い`).toContain(label);
    }
  });

  it('T-SKG-004 停止条件の SSOT が 1 file にある', () => {
    // 停止条件を 2 箇所に書くと片方だけ直って drift する。 実体は reference 側。
    const ref = resolve(SKILLS_DIR, 'kiwa-loop/references/loop-stop-conditions.md');
    expect(existsSync(ref), 'loop-stop-conditions.md が無い').toBe(true);
    const src = readFileSync(ref, 'utf8');
    expect(src).toMatch(/## 停止条件/);
    expect(src).toMatch(/## 4 分類 \(coverage\)/);
    expect(src).toMatch(/## 4 分類 \(duration\)/);
  });

  it('T-SKG-005 /kiwa-verdict が実装削除も除外宣言もしないと明記する', () => {
    // **これが外れると分類が実行に化ける**。 dead code と判定した瞬間に消す skill に
    // なると、後戻りできない判断を AI が単独で下すことになる。
    const src = read('kiwa-verdict');
    expect(src).toMatch(/実装を消さない/);
    expect(src).toMatch(/除外を宣言しない/);
  });

  it('T-SKG-006 3 skill とも責務外を明記する', () => {
    for (const s of COMMON_SKILLS) {
      expect(read(s), `${s} に責務外が無い`).toMatch(/^## 責務外$/m);
    }
  });
});

describe('test を生成する skill が共通 skill へ配線されている', () => {
  it('T-SKG-007 対象 skill が 1 件以上ある', () => {
    // 空振り防止。 導出が壊れて 0 件になると、以降の検査が全部通ってしまう。
    expect(generatorSkills().length, '対象 skill が 1 件も無い (導出が空振りしている)')
      .toBeGreaterThan(0);
  });

  it('T-SKG-008 完了条件が /kiwa-gap --metric coverage を要求する', () => {
    const missing = generatorSkills().filter(
      (s) => !completion(read(s)).includes('/kiwa-gap --metric coverage'),
    );
    expect(missing, 'coverage の gap 参照が完了条件に無い skill').toEqual([]);
  });

  it('T-SKG-009 完了条件が /kiwa-gap --metric duration を要求する', () => {
    const missing = generatorSkills().filter(
      (s) => !completion(read(s)).includes('/kiwa-gap --metric duration'),
    );
    expect(missing, 'duration の gap 参照が完了条件に無い skill').toEqual([]);
  });

  it('T-SKG-010 完了条件が残った未達の行き先を要求する', () => {
    // 「gap を見た」 だけでは、見て何もしなかった run と区別できない。
    // 0 件か、`/kiwa-verdict` の分類つきで記録することまでを条件にする。
    const missing = generatorSkills().filter(
      (s) => !completion(read(s)).includes('/kiwa-verdict'),
    );
    expect(missing, '残った未達の行き先が完了条件に無い skill').toEqual([]);
  });

  it('T-SKG-011 dashboard を直接読む古い経路が残っていない', () => {
    // 陰性対照。 差し替えたつもりで元の行が残ると、2 つの経路が併存して
    // どちらが正か読めなくなる。
    const stale = generatorSkills().filter((s) =>
      /`\/kiwa-observe` の dashboard `Execution time` section/.test(completion(read(s))),
    );
    expect(stale, '完了条件に古い dashboard 経路が残っている skill').toEqual([]);
  });

  it('T-SKG-012 共通 skill 自身は生成 skill に数えない', () => {
    // 3 skill は test を書かないので `## 既存 test の再利用` を持たない。
    // 持つと配線の検査が自分自身を対象にして循環する。
    const gens = generatorSkills();
    for (const s of COMMON_SKILLS) {
      expect(gens, `${s} が生成 skill に数えられている`).not.toContain(s);
    }
  });
});
