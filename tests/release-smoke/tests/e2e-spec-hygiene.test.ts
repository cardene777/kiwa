// e2e の spec が「実行しても落ちない書き方」 を守っていることを固定する (Issue #2112)。
//
// ## なぜ検査を置くか
//
// #2112 で 3 example の e2e が以前から落ちていた。 そのうち 3 件は、
// **落ちていることに誰も気付けない形** で入っていた。
//
// | 件 | 落ちた理由 |
// |---|---|
// | 2 件 | ページを `about:blank` に置いたまま test 内 server へ `fetch` した |
// | 1 件 | address の綴りが EIP-55 の checksum と 1 文字ずれていた |
//
// どちらも「書いた時点」 では気付けず、実行して初めて分かる。 e2e は重いので
// 日常的には走らせない = 落ちたまま残る。 静的に見つかる形なら書いた時点で止まる。
//
// ## 何を見ないか — 静的層と実行層の責務境界
//
// **`about:blank` という文字列が出てこないまま null origin になる形は見ない。**
// `newPage()` の初期 URL が `about:blank` なので、非 blank へ 1 度も遷移しない spec も、
// `newPage()` した page を遷移させないまま使う spec も null origin になる。
//
// これを静的に判定するには lexical scope を追い、helper の呼出で実引数を仮引数へ
// 対応付け、`var` と `let` の scope を区別する = **関数間の静的解析**が要る。
// 実際に試して 3 round 回したが、round ごとに解析の精度についての指摘が出続けた
// (名前で対応付けると両方向に外れる → binding ごとに直す → helper の本体を
//  定義位置で見ている → 呼出位置で見る → `var` の scope が違う …)。
// 解析部は 213 行まで伸び、その間 **実データ側の検出は 0 件のまま**だった。
//
// `rules/quality.md § 契約完備性 checklist § 責務境界` が同じ形を記録している
// (hook 110 の静的 shell 解析が 6 round 収束せず、静的層を判定できる範囲へ絞って
//  残りを実 runtime verify 層へ移す SPLIT を採った)。 ここも同じ判断を採る。
//
// | 層 | 担当 |
// |---|---|
// | 静的層 (本 file) | `goto('about:blank')` を明示的に呼ぶ形。 構文木で決定できる |
// | 実行層 (e2e 自体) | null origin から `fetch` する形すべて。 送出時に `Failed to fetch` で落ちる |
//
// 実行層が実際に効くことは実測で分かっている。 **#2112 の 2 件はまさにそれで見つけた**。
// 静的層が見ない形も、その spec を 1 度でも走らせれば同じ失敗として現れる。
//
// EIP-55 の checksum そのものも検証しない。 keccak256 が要り、この workspace に
// 新しい依存を足すことになるため。 代わりに **同じ address が 2 通りの綴りで
// 書かれていないこと** を見る (#2112 の実物はこの形で、正しい綴りが別の 3 file に
// 既にあった)。 1 度しか出てこない誤った綴りは、この検査では捕まらない。
// これも実行層が捕まえる (変異試験 R1 で確認済 = 綴りを戻すと `InvalidAddressError`)。
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT } from './skill-md.js';

/** `git` が追跡している file を拡張子で絞って列挙する。 */
function trackedFiles(globs: readonly string[]): string[] {
  return execFileSync('git', ['ls-files', ...globs], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  })
    .split('\n')
    .filter((line) => line !== '');
}

/**
 * `kiwa layers --layer e2e-generic` が `test_outputs` として宣言する場所と同じ形で
 * e2e の spec を列挙する。 手で書いた一覧を持たない。
 */
function e2eSpecs(): string[] {
  return trackedFiles(['examples/*/tests/e2e/*.spec.ts']);
}

interface SpecFacts {
  /** `page.goto('about:blank')` を呼んでいるか (コメント内の文字列は数えない)。 */
  gotoBlank: boolean;
  /** `evaluate(...)` に渡す関数の中で `fetch(...)` を呼んでいるか。 */
  fetchInEvaluate: boolean;
}

/**
 * 構文木から事実を取る。 source 文字列の検索では、コメントに書いた説明文が
 * そのまま一致してしまう (本 file 自身と、修正した 2 spec のコメントが該当する)。
 *
 * 見るのは呼出の形だけで、どの page がどの時点でどこに居るかは追わない
 * (責務境界は本 file 冒頭)。
 */
export function readSpecFacts(source: string): SpecFacts {
  const parsed = ts.createSourceFile('spec.ts', source, ts.ScriptTarget.Latest, true);
  let gotoBlank = false;
  let fetchInEvaluate = false;

  const callsFetch = (node: ts.Node): boolean => {
    let found = false;
    const scan = (n: ts.Node): void => {
      if (found) return;
      if (ts.isCallExpression(n)) {
        const callee = n.expression;
        if (
          (ts.isIdentifier(callee) && callee.text === 'fetch') ||
          (ts.isPropertyAccessExpression(callee) && callee.name.text === 'fetch')
        ) {
          found = true;
          return;
        }
      }
      ts.forEachChild(n, scan);
    };
    scan(node);
    return found;
  };

  const walk = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      const [first] = node.arguments;
      // `goto(\`about:blank\`)` の形も拾うため `isStringLiteralLike` で見る
      // (置換を持たない template literal は文字列 literal と同じ)。
      if (method === 'goto' && first !== undefined && ts.isStringLiteralLike(first)) {
        if (first.text === 'about:blank') gotoBlank = true;
      }
      if (method === 'evaluate' && node.arguments.some((arg) => callsFetch(arg))) {
        fetchInEvaluate = true;
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(parsed);
  return { gotoBlank, fetchInEvaluate };
}

/**
 * その spec が違反かを判定する。
 *
 * `evaluate` 内で `fetch` する spec が、ページを `about:blank` に明示的に置いている形だけを
 * 違反とみなす。 暗黙に null origin になる形は実行層の担当 (責務境界は本 file 冒頭)。
 */
export function isOffender(facts: SpecFacts): boolean {
  return facts.fetchInEvaluate && facts.gotoBlank;
}

/** 大小が混ざった address literal = EIP-55 の checksum を主張している綴り。 */
const ADDRESS = /(?<![0-9a-fA-F])0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g;

function claimsChecksum(address: string): boolean {
  const body = address.slice(2);
  return body !== body.toLowerCase() && body !== body.toUpperCase();
}

/** TypeScript 系は構文木の literal だけを返し、コメント内の例示を走査から外す。 */
function addressBearingText(file: string, source: string): string[] {
  if (!/\.(?:[cm]?[jt]sx?)$/.test(file)) return [source];

  const scriptKind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind);
  const literals: string[] = [];
  const walk = (node: ts.Node): void => {
    if (ts.isStringLiteralLike(node)) literals.push(node.text);
    ts.forEachChild(node, walk);
  };
  walk(parsed);
  return literals;
}

/** 同じ address について、checksum を主張する綴りを重複なく集める。 */
export function collectChecksumSpellings(
  sources: readonly (readonly [file: string, text: string])[],
): Map<string, Map<string, string[]>> {
  const byAddress = new Map<string, Map<string, string[]>>();
  for (const [file, text] of sources) {
    for (const candidate of addressBearingText(file, text)) {
      for (const match of candidate.matchAll(ADDRESS)) {
        const literal = match[0];
        if (!claimsChecksum(literal)) continue;
        const key = literal.toLowerCase();
        const spellings = byAddress.get(key) ?? new Map<string, string[]>();
        const files = spellings.get(literal) ?? [];
        if (!files.includes(file)) files.push(file);
        spellings.set(literal, files);
        byAddress.set(key, spellings);
      }
    }
  }
  return byAddress;
}

describe('e2e の spec が about:blank から fetch していない', () => {
  const specs = e2eSpecs();
  const facts = specs.map(
    (file) => [file, readSpecFacts(readFileSync(resolve(REPO_ROOT, file), 'utf8'))] as const,
  );

  it('走査対象の e2e spec が存在する', () => {
    expect(specs.length, 'e2e の spec を 1 件も列挙できていない (検査が空振りしている)').toBeGreaterThan(0);
  });

  it('evaluate 内で fetch する spec が存在する (検査の対象が居る)', () => {
    const subjects = facts.filter(([, f]) => f.fetchInEvaluate);
    expect(
      subjects.length,
      'evaluate 内で fetch する spec が 1 件も無い (検査が空振りしている)',
    ).toBeGreaterThan(0);
  });

  it('evaluate 内で fetch する spec がページを about:blank に置いていない', () => {
    const offenders = facts.filter(([, f]) => isOffender(f)).map(([file]) => file);
    expect(
      offenders,
      'about:blank は null origin で、そこからの fetch は cross-origin になる。' +
        ' test 内 server は CORS を持たないため送出時に落ちる',
    ).toEqual([]);
  });

  it('違反は evaluate 内の fetch と about:blank が揃った時だけ', () => {
    expect(isOffender({ gotoBlank: true, fetchInEvaluate: true }), '両方揃う').toBe(true);
    expect(isOffender({ gotoBlank: true, fetchInEvaluate: false }), 'fetch しない').toBe(false);
    expect(isOffender({ gotoBlank: false, fetchInEvaluate: true }), 'about:blank へ置かない').toBe(false);
  });

  it('コメントに書いた about:blank を実物と取り違えない', () => {
    const source = [
      "// ページを await page.goto('about:blank') に置くと落ちる、という説明。",
      'async function run(page) {',
      "  await page.goto('https://example.test/');",
      '  await page.evaluate(async () => { await fetch("/x"); });',
      '}',
    ].join('\n');
    expect(readSpecFacts(source)).toEqual({ gotoBlank: false, fetchInEvaluate: true });
  });

  it('実物の about:blank は、引用符でも template literal でも取りこぼさない', () => {
    expect(readSpecFacts("async function r(p) { await p.goto('about:blank'); }").gotoBlank).toBe(true);
    expect(readSpecFacts('async function r(p) { await p.goto(`about:blank`); }').gotoBlank).toBe(true);
  });

  it('property access 形式の fetch も evaluate 内の fetch として数える', () => {
    const source = 'async function r(p) { await p.evaluate(async () => globalThis.fetch("/x")); }';
    expect(readSpecFacts(source).fetchInEvaluate).toBe(true);
  });

  it('暗黙の null origin は静的層では見ない (責務境界)', () => {
    // `newPage()` の初期 URL が `about:blank` なので、この spec も null origin から
    // `fetch` する。 静的に判定するには関数間の解析が要るため実行層に任せる。
    // **見ないことを固定する** = 将来ここを変える時に、境界を動かしたと分かるようにする。
    const source = [
      'async function run(context) {',
      '  const page = await context.newPage();',
      '  await page.evaluate(async () => fetch("/x"));',
      '}',
    ].join('\n');
    const facts = readSpecFacts(source);
    expect(facts.fetchInEvaluate, 'fetch は見えている').toBe(true);
    expect(facts.gotoBlank, 'about:blank の文字列は出てこない').toBe(false);
    expect(isOffender(facts), '静的層は違反にしない (実行層の担当)').toBe(false);
  });
});

/**
 * 本 file 自身。 綴りの食い違いを見つけられることを示すため、**わざと 2 通りの綴りを
 * 反例として持っている**。 走査対象に含めると自分の反例で必ず落ちるため外す。
 *
 * 構文木にしても外れない = 反例は文字列 literal として書いてあるため。
 */
const SELF = 'tests/release-smoke/tests/e2e-spec-hygiene.test.ts';

describe('address の綴りが 1 通りに揃っている', () => {
  const tracked = trackedFiles(['*.ts', '*.tsx', '*.md', '*.mjs']);
  const sources = tracked
    .filter((file) => file !== SELF)
    .map((file) => [file, readFileSync(resolve(REPO_ROOT, file), 'utf8')] as const);
  const byAddress = collectChecksumSpellings(sources);

  it('走査から外す自 file が実在する', () => {
    // 決め打ちの path なので、rename すると除外が黙って効かなくなる。
    // 効かなくなった時は自分の反例を拾って落ちるが、原因が読み取れない。
    // ここで先に落とすと「除外先が動いた」 と分かる。
    expect(tracked, `${SELF} が追跡下に無い (rename したなら SELF も直す)`).toContain(SELF);
  });

  it('checksum を主張する address literal が存在する', () => {
    expect(
      byAddress.size,
      'checksum を主張する address literal が 1 件も無い (検査が空振りしている)',
    ).toBeGreaterThan(0);
  });

  it('同じ address が 2 通りの綴りで書かれていない', () => {
    const conflicts = [...byAddress.entries()]
      .filter(([, spellings]) => spellings.size > 1)
      .map(([address, spellings]) => ({
        address,
        spellings: [...spellings.entries()].map(([literal, files]) => `${literal} (${files.join(', ')})`),
      }));
    expect(
      conflicts,
      '同じ address が違う綴りで書かれている。 EIP-55 の checksum は 1 通りしかないため、' +
        ' どちらかが誤りで viem に渡した時点で InvalidAddressError になる',
    ).toEqual([]);
  });

  it('綴りの食い違いを実際に見つけられる', () => {
    const found = collectChecksumSpellings([
      ['a.ts', "const value = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';"],
      ['b.ts', "const value = '0xf39Fd6e51aad88F6F4ce6aB8827279cfFFb92266';"],
      ['c.ts', "const value = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';"],
    ]);
    const spellings = found.get('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    expect(spellings?.size, '全小文字は checksum を主張しないので数えない').toBe(2);
  });

  it('TypeScript のコメント内にある綴りは実物と取り違えない', () => {
    const found = collectChecksumSpellings([
      [
        'comment.ts',
        [
          '// 旧値 0xf39Fd6e51aad88F6F4ce6aB8827279cfFFb92266 は誤り。',
          "const owner = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';",
        ].join('\n'),
      ],
    ]);
    const spellings = found.get('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    expect(spellings?.size).toBe(1);
  });

  it('markdown は構文木を持たないので source 全体を見る', () => {
    const found = collectChecksumSpellings([
      ['doc.md', '本文中の 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 も対象にする。'],
    ]);
    expect(found.get('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')?.size).toBe(1);
  });

  it('1 度しか出てこない誤った綴りは、明記した限界どおり conflict にしない', () => {
    const found = collectChecksumSpellings([
      ['only.ts', "const owner = '0xf39Fd6e51aad88F6F4ce6aB8827279cfFFb92266';"],
    ]);
    const conflicts = [...found.values()].filter((spellings) => spellings.size > 1);
    expect(conflicts).toEqual([]);
  });
});
