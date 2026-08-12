import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { repoRoot } from './repo-root.js';

/**
 * SKILL.md を読む共通経路 (#1920)。
 *
 * 観測経路の修正 6 件 (#1908 / #1910 / #1909 / #1915 / #1914 / #1918) が 1 週間で順に
 * 検査を足したため、 「Step N の本文と code fence を取る」 が 3 通り実装されていた。
 *
 * **3 つは範囲の閉じ方が違った**。 `skill-vitest-scope` と `skill-run-history` は次の
 * `### ` で閉じるが、 `skill-script-imports` は file 末尾まで探していた = 対象 Step から
 * fence が消えた時に後続 Step の fence を拾い、 別の script を検査したまま緑になる
 * (#1914 の Round 1 F3 が前者で塞いだ形が、 後者には入っていなかった)。
 *
 * 閉じる側に揃える。 緩い側に揃えると、 塞いだはずの穴が共通化で開き直る。
 */

export const REPO_ROOT = repoRoot(dirname(fileURLToPath(import.meta.url)));

export function read(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

export function skillBody(skill: string): string {
  return read(`.claude/skills/${skill}/SKILL.md`);
}

/**
 * 指定した heading の本文 (次の同レベル heading まで)。
 *
 * 呼出側が body を渡せる。 検査の識別力を確かめるために書き換えた body を通す経路が
 * あり (`skill-script-imports` の打ち消し注入)、 file からしか読めないと当てられない。
 */
export function stepSectionIn(body: string, heading: RegExp): string {
  const at = body.search(heading);
  if (at < 0) throw new Error(`${heading} が見つからない`);
  const rest = body.slice(at);
  const next = rest.slice(1).search(/^### /m);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

export function stepSection(skill: string, heading: RegExp): string {
  return stepSectionIn(skillBody(skill), heading);
}

/**
 * 指定した Step が持つ code fence の中身。
 *
 * 範囲は `stepSectionIn` が閉じるので、 対象 Step から fence が消えれば **見つからない**
 * ことで落ちる。 後続 Step の fence に流れない。
 */
export function stepFenceIn(body: string, heading: RegExp, lang: string): string {
  const section = stepSectionIn(body, heading);
  const fence = new RegExp('```' + lang + '\\n([\\s\\S]*?)```').exec(section);
  if (!fence) throw new Error(`${heading} に ${lang} の code fence が無い`);
  return fence[1]!;
}

export function stepFence(skill: string, heading: RegExp, lang: string): string {
  return stepFenceIn(skillBody(skill), heading, lang);
}

/**
 * root が宣言している依存の全件 (dependencies + devDependencies)。
 *
 * 実行できることは宣言があることを意味しない。 link は宣言を消しても次の
 * `pnpm install` まで残るため、 実行検査だけでは消えた宣言に気付けない (#1908 / #1915 が
 * それぞれ同じ検査を持っていた)。
 */
export function rootDependencies(): Record<string, string> {
  const root = JSON.parse(read('package.json')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return { ...root.dependencies, ...root.devDependencies };
}
