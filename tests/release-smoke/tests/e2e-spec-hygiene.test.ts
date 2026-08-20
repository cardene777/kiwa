// e2e の spec が「実行しても落ちない書き方」 を守っていることを固定する (Issue #2112)。
//
// ## なぜ検査を置くか
//
// #2112 で 4 件の e2e が以前から落ちていた。 4 件のうち 3 件は、
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
// ## 何を見ないか
//
// EIP-55 の checksum そのものは検証しない。 keccak256 が要り、この workspace に
// 新しい依存を足すことになるため。 代わりに **同じ address が 2 通りの綴りで
// 書かれていないこと** を見る (#2112 の実物はこの形で、正しい綴りが別の 3 file に
// 既にあった)。 1 度しか出てこない誤った綴りは、この検査では捕まらない。
//
// 実際の checksum 違反は reorg の e2e が実行時に落として捕まえる
// (変異試験 R1 で確認済 = 綴りを戻すと `InvalidAddressError` で落ちる)。
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
  /** `about:blank` 以外へ明示的に遷移しているか。 */
  gotoNonBlank: boolean;
  /** `evaluate(...)` に渡す関数の中で `fetch(...)` を呼んでいるか。 */
  fetchInEvaluate: boolean;
  /** `newPage()` したのに `about:blank` 以外へ遷移していない page 変数。 */
  unnavigatedPages: string[];
}

/**
 * 構文木から事実を取る。 source 文字列の検索では、コメントに書いた説明文が
 * そのまま一致してしまう (本 file 自身と、修正した 2 spec のコメントが該当する)。
 */
export function readSpecFacts(source: string): SpecFacts {
  const parsed = ts.createSourceFile('spec.ts', source, ts.ScriptTarget.Latest, true);
  let gotoBlank = false;
  let gotoNonBlank = false;
  let fetchInEvaluate = false;
  const newPages = new Set<string>();
  const navigatedPages = new Set<string>();

  const stringValue = (node: ts.Node): string | undefined =>
    ts.isStringLiteralLike(node) ? node.text : undefined;

  const unwrapCall = (node: ts.Expression | undefined): ts.CallExpression | undefined => {
    if (node === undefined) return undefined;
    const expression = ts.isAwaitExpression(node) ? node.expression : node;
    return ts.isCallExpression(expression) ? expression : undefined;
  };

  const isMethodCall = (node: ts.CallExpression, method: string): boolean =>
    ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === method;

  const callsFetch = (node: ts.Node): boolean => {
    let found = false;
    const scan = (n: ts.Node): void => {
      if (found) return;
      if (ts.isCallExpression(n)) {
        const expression = n.expression;
        if (
          (ts.isIdentifier(expression) && expression.text === 'fetch') ||
          (ts.isPropertyAccessExpression(expression) && expression.name.text === 'fetch')
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
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const call = unwrapCall(node.initializer);
      if (call !== undefined && isMethodCall(call, 'newPage')) {
        newPages.add(node.name.text);
      }
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      const [first] = node.arguments;
      if (method === 'goto' && first !== undefined) {
        const destination = stringValue(first);
        if (destination === 'about:blank') {
          gotoBlank = true;
        } else {
          gotoNonBlank = true;
          const receiver = node.expression.expression;
          if (ts.isIdentifier(receiver)) navigatedPages.add(receiver.text);
        }
      }
      if (method === 'evaluate' && node.arguments.some((arg) => callsFetch(arg))) {
        fetchInEvaluate = true;
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(parsed);
  return {
    gotoBlank,
    gotoNonBlank,
    fetchInEvaluate,
    unnavigatedPages: [...newPages].filter((page) => !navigatedPages.has(page)).sort(),
  };
}

/**
 * その spec が違反かを判定する。
 *
 * `evaluate` 内で `fetch` する spec は、投げる前にページが test 内 server と同じ origin に
 * 居なければならない。 null origin になる形は 3 つある。
 *
 * | 形 | 判定 |
 * |---|---|
 * | `goto('about:blank')` を明示的に呼ぶ | `gotoBlank` |
 * | 非 blank へ 1 度も遷移しない | `!gotoNonBlank` |
 * | `newPage()` した page を遷移させないまま使う | `unnavigatedPages` |
 *
 * 2 つ目と 3 つ目は **`about:blank` という文字列がどこにも出てこない**。
 * `newPage()` の初期 URL が `about:blank` だからで、明示的な呼出だけを見ると取りこぼす。
 */
export function isOffender(facts: SpecFacts): boolean {
  if (!facts.fetchInEvaluate) return false;
  return facts.gotoBlank || !facts.gotoNonBlank || facts.unnavigatedPages.length > 0;
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
    const offenders = facts
      .filter(([, f]) => isOffender(f))
      .map(([file, f]) => ({ file, unnavigatedPages: f.unnavigatedPages }));
    expect(
      offenders,
      'about:blank は null origin で、そこからの fetch は cross-origin になる。' +
        ' test 内 server は CORS を持たないため送出時に落ちる',
    ).toEqual([]);
  });

  it('null origin になる 3 つの形をすべて違反とみなす', () => {
    const base = { gotoBlank: false, gotoNonBlank: true, fetchInEvaluate: true, unnavigatedPages: [] };
    // 明示的に about:blank へ置く
    expect(isOffender({ ...base, gotoBlank: true }), '明示的な about:blank').toBe(true);
    // 非 blank へ 1 度も遷移しない (newPage の初期 URL が about:blank のまま)
    expect(isOffender({ ...base, gotoNonBlank: false }), '非 blank へ未遷移').toBe(true);
    // newPage した page を遷移させないまま使う
    expect(isOffender({ ...base, unnavigatedPages: ['pageB'] }), '未遷移の page').toBe(true);
    // 同じ origin へ遷移していれば違反でない
    expect(isOffender(base), '非 blank へ遷移済').toBe(false);
    // fetch しない spec はそもそも対象外
    expect(
      isOffender({ ...base, fetchInEvaluate: false, gotoBlank: true }),
      'evaluate 内で fetch しない spec は対象外',
    ).toBe(false);
  });

  it('コメントに書いた about:blank を実物と取り違えない', () => {
    const source = [
      "// ページを await page.goto('about:blank') に置くと落ちる、という説明。",
      'async function run(page) {',
      "  await page.goto('https://example.test/');",
      '  await page.evaluate(async () => { await fetch("/x"); });',
      '}',
    ].join('\n');
    expect(readSpecFacts(source)).toEqual({
      gotoBlank: false,
      gotoNonBlank: true,
      fetchInEvaluate: true,
      unnavigatedPages: [],
    });
  });

  it('明示・暗黙の about:blank は取りこぼさない', () => {
    const explicit = "async function run(page) { await page.goto(`about:blank`); }";
    expect(readSpecFacts(explicit).gotoBlank).toBe(true);

    const implicit = [
      'async function run(context) {',
      '  const page = await context.newPage();',
      '  await page.evaluate(async () => fetch("/x"));',
      '}',
    ].join('\n');
    expect(readSpecFacts(implicit)).toMatchObject({
      gotoNonBlank: false,
      fetchInEvaluate: true,
      unnavigatedPages: ['page'],
    });
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

  it('1 度しか出てこない誤った綴りは、明記した限界どおり conflict にしない', () => {
    const found = collectChecksumSpellings([
      ['only.ts', "const owner = '0xf39Fd6e51aad88F6F4ce6aB8827279cfFFb92266';"],
    ]);
    const conflicts = [...found.values()].filter((spellings) => spellings.size > 1);
    expect(conflicts).toEqual([]);
  });
});
