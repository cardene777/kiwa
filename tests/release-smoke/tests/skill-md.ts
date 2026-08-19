import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
 * `.claude/skills` 直下の dir 名 (SKILL.md の有無を問わない、 #1922)。
 *
 * 列挙そのものは 5 file が個別に書いていた。 **求める集合は 3 通りに割れる** ため、 1 つの
 * 関数に畳まず 2 つの primitive を出して呼出側が選ぶ形にする。
 *
 * | 呼出側が欲しい集合 | 使う関数 |
 * |---|---|
 * | dir 全件 | `skillDirNames()` |
 * | SKILL.md を持つもの | `skillsWithSkillMd()` |
 * | SKILL.md を持たないもの | `skillDirNames()` から `skillsWithSkillMd()` を引く |
 *
 * 3 つ目は「manifest を持たない skill を検出する」 検査が使う = 集合を 1 つに畳むと、
 * その検査が見たい対象が消える。
 */
export function skillDirNames(): string[] {
  return readdirSync(resolve(REPO_ROOT, '.claude/skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

/** `.claude/skills` 直下のうち SKILL.md を持つ dir 名。 */
export function skillsWithSkillMd(): string[] {
  return skillDirNames().filter((name) =>
    existsSync(resolve(REPO_ROOT, '.claude/skills', name, 'SKILL.md')),
  );
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
 * 指定した heading の本文 (**同じか上の level の heading まで**)。
 *
 * `stepSectionIn` は次の `### ` で閉じるため、 heading の level が `###` 以外だと範囲が
 * 実態とずれる。
 *
 * | 対象の level | `stepSectionIn` の閉じ方 | 起きること |
 * |---|---|---|
 * | `## Step N` (`/kiwa-app`) | 次の `### ` まで | **後続の `## Step` を飲み込む** |
 * | `#### Step 5a` (`/kiwa-forge`) | 次の `### ` まで | 同 `###` 配下の後続 `####` を飲み込む |
 *
 * 飲み込むと、 対象 Step から fence が消えた時に **隣の Step の fence を拾って緑になる**
 * (#1920 が `skill-script-imports` で塞いだ形と同じ)。 level を数えて閉じれば、 消えたことが
 * 「見つからない」 として落ちる。
 */
export function headingSectionIn(body: string, heading: RegExp): string {
  const at = body.search(heading);
  if (at < 0) throw new Error(`${heading} が見つからない`);
  const rest = body.slice(at);
  const level = /^#+/.exec(rest)?.[0].length ?? 0;
  if (level === 0) throw new Error(`${heading} が heading 行に一致していない`);
  // 探索は **見出し行の次の行から** 始める。 `rest.slice(1)` で 1 文字だけ落とす形にすると、
  // `m` flag の `^` が文字列の先頭にも一致するため、 対象の見出し自身を「次の見出し」 として
  // 拾って範囲が 1 文字になる (実測)。 `### ` で閉じる `stepSectionIn` は level が違うため
  // 同じ書き方でも当たらなかっただけで、 同 level を探す本関数では成立しない。
  //
  // **code fence の中は見ない**。 shell の comment 行 (`# 既存 worktree 掃除`) は行頭の `#` が
  // markdown の見出しと同じ形をしており、 素朴に探すと fence の 1 行目で範囲が閉じる
  // (実測 = `/docs-publish-kiwa` の Step 3 が 46 文字で切れ、 fence が「無い」 ことになった)。
  const lines = rest.split('\n');
  const closing = new RegExp(`^#{1,${level}} `);
  let inFence = false;
  let end = lines.length;
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && closing.test(line)) {
      end = i;
      break;
    }
  }
  return lines.slice(0, end).join('\n') + (end === lines.length ? '' : '\n');
}

/** `headingSectionIn` の範囲にある最初の code fence の中身。 */
export function fenceUnderIn(body: string, heading: RegExp, lang: string): string {
  const section = headingSectionIn(body, heading);
  const fence = new RegExp('```' + lang + '\\n([\\s\\S]*?)```').exec(section);
  if (!fence) throw new Error(`${heading} に ${lang} の code fence が無い`);
  return fence[1]!;
}

export function fenceUnder(skill: string, heading: RegExp, lang: string): string {
  return fenceUnderIn(skillBody(skill), heading, lang);
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
