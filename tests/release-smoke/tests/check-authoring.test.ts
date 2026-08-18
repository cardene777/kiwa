import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, read } from './skill-md.js';

/**
 * 0 件で通る検査を作らせない (#2011)。
 *
 * `it.each(list)` は `list` が空だと **test を 1 件も生成せずに緑になる**。 検査が何も見て
 * いない状態と、 見た上で問題が無い状態が同じ結果になる。
 *
 * 本 session の 5 PR で「検査が減っただけで緑」 が 6 回出ており、 うち 3 件がこの形だった。
 * いずれも変異試験で初めて判明し、 通常の実行では 1 度も落ちていない。
 *
 * **literal の一覧は対象外**。 書いた時点で件数が決まっており、 空になりようがない
 * (実測で 13 箇所中 7 箇所が literal)。 対象を広げると、 空になり得ない一覧にまで保証を
 * 書かせることになり、 検査が形骸化する。
 *
 * 手順の全文は `docs/quality/check-authoring.md`。
 */

const TEST_DIR = 'tests/release-smoke/tests';

/** 本 dir の検査 file (自分自身も含む)。 */
function testFiles(): string[] {
  return readdirSync(resolve(REPO_ROOT, TEST_DIR))
    .filter((name) => name.endsWith('.test.ts'))
    .sort();
}

/**
 * comment を落とした source。
 *
 * comment 内の説明文が `it.each(list)` のような形を含むと、 **説明を対象として拾う**
 * (本 file 自身の doc comment で実際に踏んだ)。 走査の前に落とす。
 *
 * 落とすのは block comment と、 行頭が `//` / `*` の行だけ。 行末の trailing comment は
 * 残す = 文字列 literal の中の `//` (URL 等) を巻き込まないため。 trailing comment に
 * `it.each(...)` を書いた場合は拾うが、 その形は実測で存在しない。
 */
function withoutComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => {
      const t = line.trimStart();
      return !t.startsWith('//') && !t.startsWith('*');
    })
    .join('\n');
}

/** `it.each(<ident>)` / `it.each(Object.keys(<ident>))` が名指しする識別子。 */
function eachSources(raw: string): string[] {
  const src = withoutComments(raw);
  const found = new Set<string>();
  for (const m of src.matchAll(/\b(?:it|test)\.each\(\s*(Object\.keys\(\s*)?([A-Za-z_$][\w$]*)/g)) {
    found.add(m[2]!);
  }
  return [...found].sort();
}

/**
 * その識別子の定義の右辺 (先頭 1 文字)。
 *
 * `const X = [` なら literal、 それ以外は実行時に導いているとみなす。 関数宣言
 * (`function X()`) は常に実行時導出。
 */
function definitionKind(src: string, ident: string): 'literal' | 'derived' | 'unknown' {
  if (new RegExp(`function\\s+${ident}\\s*\\(`).test(src)) return 'derived';
  const m = new RegExp(`(?:const|let|var)\\s+${ident}\\b[^=\\n]*=\\s*([\\s\\S]{0,4})`).exec(src);
  if (!m) return 'unknown';
  return m[1]!.trimStart().startsWith('[') ? 'literal' : 'derived';
}

/** その識別子の非空を主張している行があるか。 */
function hasNonEmptyGuard(src: string, ident: string): boolean {
  // `expect(X.length).toBeGreaterThan(0)` / `expect(X).toContain(...)` /
  // `expect(Object.keys(X).length).toBeGreaterThanOrEqual(N)` を受ける。
  // **名指しを要求する** = 別名の局所変数に代入してから確かめると、 ここから見えない。
  const pattern = new RegExp(
    `expect\\(\\s*(?:Object\\.keys\\(\\s*)?${ident}\\b[\\s\\S]{0,80}?\\)[\\s\\S]{0,120}?` +
      `(toBeGreaterThan|toBeGreaterThanOrEqual|toContain|toHaveLength)`,
  );
  return pattern.test(src);
}

/**
 * `it.each` の対象として使われる識別子のうち、 同 file 内で 2 度以上定義されているもの。
 *
 * 名前が重なると **1 つの保証で両方が通る**。 file 単位で名前を見る以上これは避けられないので、
 * 名前を分けさせる (実測で `test-taxonomy-existence.test.ts` が `target` を 2 つ持っていた)。
 */
function shadowedSources(raw: string): string[] {
  const src = withoutComments(raw);
  return eachSources(raw).filter((ident) => {
    // literal は書いた時点で件数が決まっており、 名前が重なっても 0 件にならない。
    if (definitionKind(raw, ident) === 'literal') return false;
    const defs = src.match(new RegExp(`(?:const|let|var)\\s+${ident}\\b\\s*(?::[^=]*)?=`, 'g'));
    return (defs?.length ?? 0) > 1;
  });
}

describe('it.each に渡す一覧が空にならないことを確かめている', () => {
  const files = testFiles();

  it('検査 file を読めている', () => {
    // 0 件でも `it.each` は 1 件も走らずに緑になる。 本 file 自身が同じ穴を持たないようにする。
    // `files` と `testFiles()` の両方を名指しで保証する = 下の it.each は両方を対象にする。
    expect(files.length).toBeGreaterThan(0);
    expect(testFiles().length).toBeGreaterThan(0);
    expect(files).toContain('check-authoring.test.ts');
  });

  it.each(files)('%s の実行時導出の一覧に非空の保証がある', (name) => {
    const src = read(`${TEST_DIR}/${name}`);
    const missing = eachSources(src)
      .filter((ident) => definitionKind(src, ident) !== 'literal')
      .filter((ident) => !hasNonEmptyGuard(src, ident));
    expect(
      missing,
      `${name}: it.each の対象が空でも緑になる。 ` +
        `expect(<ident>.length).toBeGreaterThan(0) 等で名指しの保証を書く ` +
        `(docs/quality/check-authoring.md § 形 1)`,
    ).toEqual([]);
  });

  /** fixture は data file に置く = 検査 file 自身の source を走査するため、 fixture を
   * source 内に書くと自分の文字列を拾って落ちる (実装中に実際に踏んだ)。 */
  function unguardedIn(fixture: string): string[] {
    const src = read(`tests/release-smoke/fixtures/check-authoring/${fixture}`);
    return eachSources(src)
      .filter((ident) => definitionKind(src, ident) !== 'literal')
      .filter((ident) => !hasNonEmptyGuard(src, ident));
  }

  it('literal の一覧を対象にしない', () => {
    // 誤検出すると、 空になり得ない一覧にまで保証を書かせることになり検査が形骸化する。
    expect(unguardedIn('literal-list.txt')).toEqual([]);
  });

  it('名指しの保証がある実行時導出を通す', () => {
    expect(unguardedIn('derived-guarded.txt')).toEqual([]);
  });

  it('保証の無い実行時導出を見逃さない', () => {
    // 検査そのものの識別力。 保証を外した形を通し、 検出できることを見る。
    expect(unguardedIn('derived-unguarded.txt')).toEqual(['targets']);
  });

  it('等値の主張は保証として受けない', () => {
    // `expect(x).toEqual([])` は x が空でも成立する。 これを保証として受けると、
    // 「空でないこと」 を 1 度も確かめないまま緑になる。
    expect(unguardedIn('toequal-guard.txt')).toEqual(['targets']);
  });

  it('comment 内の言及を対象にしない', () => {
    // 説明文が `it.each(...)` の形を含むことがある。 拾うと保証の書きようが無い対象を要求する。
    expect(unguardedIn('line-comment.txt')).toEqual([]);
  });

  it.each(testFiles())('%s が it.each の対象名を使い回していない', (name) => {
    // 同名だと 1 つの保証で両方が通る。 名前を分ければ保証も 1 対 1 になる。
    expect(
      shadowedSources(read(`${TEST_DIR}/${name}`)),
      `${name}: it.each の対象名が重複している。 名前を分ける ` +
        `(docs/quality/check-authoring.md § 形 1)`,
    ).toEqual([]);
  });

  it('使い回した対象名を見逃さない', () => {
    const src = read('tests/release-smoke/fixtures/check-authoring/duplicate-name.txt');
    expect(shadowedSources(src)).toEqual(['target']);
  });

  it('手順の doc が実在し 2 形を持つ', () => {
    // 失敗 message が doc を指すため、 消えると案内先が消える。
    const doc = read('docs/quality/check-authoring.md');
    expect(doc).toContain('## 2 つの形');
    expect(doc).toContain('### 形 1 — 0 件でも通る');
    expect(doc).toContain('### 形 2 — 集合を畳むと片側の欠落が消える');
  });

  it('別名に代入した保証は受けない', () => {
    // `const s = f(); expect(s.length)...` は名指しでないため見えない。 見えない保証を
    // 受けると、 対象を差し替えた時に保証だけ古いまま残る。
    expect(unguardedIn('aliased-guard.txt')).toEqual(['layerSkills']);
  });
});
