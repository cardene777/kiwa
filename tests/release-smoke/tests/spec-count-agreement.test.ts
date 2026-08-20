// spec に書いた件数と実物がずれた時にその場で落とす (Issue #2099)。
//
// ## なぜ検査を置くか
//
// 件数と、同じ文の中で列挙した TC 番号の個数が食い違う誤りが繰り返し起きた。
// 直近 (#2098) の実例は「合成 results を使う 6 件 (005 / 006 / 009 / 010 / 011 / 012 / 013)」
// で、6 と書いて 7 個並べていた。 1 session で 5 回目の同型になる。
//
// `rules/quality.md § 導出可能記述は人手で書かない` (GH #824) は 3 経路を定めており、
// 経路 3 (実物を見て書き、裏取りを残す) を人手で回して 5 回外している。
// 経路 1 (実物から導く検査を置く) に切り替える。
//
// ## 何を突き合わせるか
//
//   `全 N 件`          → spec の TC 表の行数 (重複を除いた番号の個数)
//   `N 件 (a / b / c)` → 括弧内の番号の個数
//
// ## 番号の数え方
//
// 列挙は先頭だけ完全形で、以降は数字のみに短縮される慣行がある。
//
//   T-UNIT-008 / 009 / 010     → 3 個
//   TC-014 / 015 / 021         → 3 個
//   TC-E001 / E002 / E003      → 3 個
//
// 短縮形を数えないと常に 1 と数えて誤検出する。 逆に括弧内の数字を無条件に拾うと
// `(1 node(s))` のような無関係な値を数えて誤検出する。 3 桁の裸の数字だけを短縮形として
// 受け、前後が英数字や `-` の場合は数えない。
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SPEC_ROOT = join(REPO_ROOT, 'tests/spec');

/** `| T-XXX-NNN |` / `| TC-NNN |` / `| TC-EXXX |` で始まる表の行。 */
const TABLE_ROW = /^\|\s*(T-[A-Z0-9]+-\d+|TC-E?\d+)\s*\|/gm;

/** `全 N 件` の主張。 */
const TOTAL_CLAIM = /全\s*(\d+)\s*件/g;

/** `N 件 (...)` の主張。 括弧の中身を後で番号として読む。 */
const ENUM_CLAIM = /(\d+)\s*件\s*[（(]([^）)]*)[）)]/g;

/**
 * 括弧内の TC 番号を数える。
 *
 * 完全形 (`T-UNIT-008` / `TC-014` / `TC-E001`) と、 短縮形 (`009` / `E002`) を受ける。
 * 短縮形は前後が英数字 / `-` でない時だけ番号とみなす = `(1 node(s))` の `1` は
 * 桁が足りず、 `wcag21aa` の `21` は前後が英字のため数えない。
 */
function countIds(inner: string): number {
  const ids = inner.match(
    /T-[A-Z0-9]+-\d+|TC-E?\d+|(?<![\dA-Za-z-])E?\d{3}(?![\dA-Za-z-])/g,
  );
  return ids === null ? 0 : ids.length;
}

function listSpecFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...listSpecFiles(full));
      continue;
    }
    if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

interface Claim {
  file: string;
  line: number;
  claimed: number;
  actual: number;
  quote: string;
}

function collectClaims(): { totals: Claim[]; enums: Claim[]; files: number } {
  const totals: Claim[] = [];
  const enums: Claim[] = [];
  const files = listSpecFiles(SPEC_ROOT);
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const rel = relative(REPO_ROOT, file);
    // 表の行にある番号。 同じ番号が 2 度書かれた spec でも分母は一意な個数にする。
    const rows = new Set(
      [...source.matchAll(TABLE_ROW)].map((m) => m[1] as string),
    );
    const lines = source.split('\n');
    for (const [index, line] of lines.entries()) {
      for (const m of line.matchAll(TOTAL_CLAIM)) {
        totals.push({
          file: rel,
          line: index + 1,
          claimed: Number(m[1]),
          actual: rows.size,
          quote: m[0],
        });
      }
      for (const m of line.matchAll(ENUM_CLAIM)) {
        const inner = m[2] ?? '';
        const actual = countIds(inner);
        // 番号を 1 つも含まない括弧は対象外 (`全 20 件、全件自動化推奨` のような形)。
        if (actual === 0) continue;
        enums.push({
          file: rel,
          line: index + 1,
          claimed: Number(m[1]),
          actual,
          quote: `${m[1]} 件 (${inner.trim()})`,
        });
      }
    }
  }
  return { totals, enums, files: files.length };
}

describe('spec の件数の主張 (#2099)', () => {
  const { totals, enums, files } = collectClaims();

  it('spec を走査できている', () => {
    // 集合が空だと以下の突き合わせが素通りする。 走査対象と、そこから取れた主張の
    // 各種類に下限を置く。 合計だけを見ると一方の抽出が 0 件でも対応する検査が恒真になる。
    expect(files, 'spec markdown を 1 件も見つけられない (検査が空振りしている)').toBeGreaterThan(0);
    expect(
      totals.length,
      '`全 N 件` の主張を 1 件も見つけられない (抽出が壊れている可能性)',
    ).toBeGreaterThan(0);
    expect(
      enums.length,
      '`N 件 (a / b / c)` の主張を 1 件も見つけられない (抽出が壊れている可能性)',
    ).toBeGreaterThan(0);
  });

  it('`全 N 件` が TC 表の行数と一致する', () => {
    const mismatched = totals.filter((c) => c.claimed !== c.actual);
    expect(
      mismatched.map((c) => `${c.file}:${c.line} "${c.quote}" 実 TC 行 ${c.actual}`),
      '宣言した件数と TC 表の行数が食い違う',
    ).toEqual([]);
  });

  it('`N 件 (a / b / c)` が括弧内の番号数と一致する', () => {
    const mismatched = enums.filter((c) => c.claimed !== c.actual);
    expect(
      mismatched.map((c) => `${c.file}:${c.line} "${c.quote}" 列挙 ${c.actual} 個`),
      '宣言した件数と列挙した番号の個数が食い違う',
    ).toEqual([]);
  });

  it('実際の ID 形式と短縮形を数え、無関係な数字を数えない', () => {
    // 抽出条件そのものの検査。 spec の中身に依らず固定する = 条件を緩めた / 狭めた時に
    // 実 spec が偶然通っても、ここで落ちる。
    expect(
      '| T-UNIT-008 |\n| TC-014 |\n| TC-E001 |'.match(TABLE_ROW),
      '表行の ID 形式を取りこぼしている',
    ).toEqual(['| T-UNIT-008 |', '| TC-014 |', '| TC-E001 |']);
    expect(countIds('T-UNIT-008 / 009 / 010'), '短縮形を取りこぼしている').toBe(3);
    expect(countIds('TC-014 / 015 / 021 / 022 / 023'), '短縮形を取りこぼしている').toBe(5);
    expect(countIds('TC-E001 / E002 / E003'), '英字 prefix 付き短縮形を取りこぼしている').toBe(3);
    expect(countIds('TC-017 / TC-018'), '完全形を取りこぼしている').toBe(2);
    expect(countIds('1 node(s)'), '無関係な数字を数えている').toBe(0);
    expect(countIds('wcag2a / wcag21aa'), '無関係な数字を数えている').toBe(0);
    expect(countIds('なし'), '番号の無い括弧を数えている').toBe(0);
  });
});
