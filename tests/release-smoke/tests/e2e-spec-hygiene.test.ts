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
  /** `evaluate(...)` に渡す関数の中で `fetch(...)` を呼んでいるか。 */
  fetchInEvaluate: boolean;
}

/**
 * 構文木から事実を取る。 source 文字列の検索では、コメントに書いた説明文が
 * そのまま一致してしまう (本 file 自身と、修正した 2 spec のコメントが該当する)。
 */
export function readSpecFacts(source: string): SpecFacts {
  const parsed = ts.createSourceFile('spec.ts', source, ts.ScriptTarget.Latest, true);
  let gotoBlank = false;
  let fetchInEvaluate = false;

  const callsFetch = (node: ts.Node): boolean => {
    let found = false;
    const scan = (n: ts.Node): void => {
      if (found) return;
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'fetch') {
        found = true;
        return;
      }
      ts.forEachChild(n, scan);
    };
    ts.forEachChild(node, scan);
    return found;
  };

  const walk = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      const [first] = node.arguments;
      if (method === 'goto' && first !== undefined && ts.isStringLiteral(first)) {
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

/** 大小が混ざった address literal = EIP-55 の checksum を主張している綴り。 */
const ADDRESS = /0x[0-9a-fA-F]{40}/g;

function claimsChecksum(address: string): boolean {
  const body = address.slice(2);
  return body !== body.toLowerCase() && body !== body.toUpperCase();
}

/** 同じ address について、checksum を主張する綴りを重複なく集める。 */
export function collectChecksumSpellings(
  sources: readonly (readonly [file: string, text: string])[],
): Map<string, Map<string, string[]>> {
  const byAddress = new Map<string, Map<string, string[]>>();
  for (const [file, text] of sources) {
    for (const match of text.matchAll(ADDRESS)) {
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
      .filter(([, f]) => f.fetchInEvaluate && f.gotoBlank)
      .map(([file]) => file);
    expect(
      offenders,
      'about:blank は null origin で、そこからの fetch は cross-origin になる。' +
        ' test 内 server は CORS を持たないため送出時に落ちる',
    ).toEqual([]);
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

  it('実物の about:blank は取りこぼさない', () => {
    const source = "async function run(page) { await page.goto('about:blank'); }";
    expect(readSpecFacts(source).gotoBlank).toBe(true);
  });
});

describe('address の綴りが 1 通りに揃っている', () => {
  const sources = trackedFiles(['*.ts', '*.tsx', '*.md', '*.mjs']).map(
    (file) => [file, readFileSync(resolve(REPO_ROOT, file), 'utf8')] as const,
  );
  const byAddress = collectChecksumSpellings(sources);

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
      ['a.ts', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
      ['b.ts', '0xf39Fd6e51aad88F6F4ce6aB8827279cfFFb92266'],
      ['c.ts', '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
    ]);
    const spellings = found.get('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    expect(spellings?.size, '全小文字は checksum を主張しないので数えない').toBe(2);
  });
});
