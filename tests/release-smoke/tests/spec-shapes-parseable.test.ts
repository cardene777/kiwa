import { describe, expect, it } from 'vitest';

import { parseSpec } from '@kiwa-lab/core';

import { headingSectionIn, read, skillBody } from './skill-md.js';

/**
 * `/kiwa-design` が宣言する全ての列形を `parseSpec` が読めるか (#2072)。
 *
 * Layer 3 (`/kiwa-observe`) は `analyzeSpecCoverage` 経由で `parseSpec` を呼ぶ。 読めない
 * 形があると、 その layer では spec coverage の判定が **1 度も走らない**。 dashboard は
 * 「判定していない」 と正しく書く (#1897) ので誤報にはならないが、 機能が無いことに
 * 気付けない。
 *
 * 実測で 17 形のうち 9 形が読めなかった。 原因は必須列に `given` / `when` を置いていた
 * こと = 入力側の列名は layer ごとに違う (`FormData` / `Args`、 `Component` / `Props`、
 * `Layout` / `Slots` / `Children`、 `Job` 等)。
 *
 * 検査は **宣言から形を導く**。 列を手で写すと layer が増えた時にここだけ古くなる。
 */

const DESIGN = skillBody('kiwa-design');

/** 汎用 9 column 表 (日本語列)。 専用節を持たない layer が使う。 */
const GENERIC = [
  'テスト ID',
  'テストレベル',
  'テスト観点',
  '前提条件',
  '入力値',
  '操作手順',
  '期待結果',
  '優先度',
  '自動化',
];

/** `#### {layer} layer 専用 column` 節が定義する列。 */
function columnsOf(layer: string): string[] {
  const section = headingSectionIn(DESIGN, new RegExp(`^#### ${layer} layer 専用 column`, 'm'));
  const at = section.indexOf('| 項目 | 内容 |');
  const out: string[] = [];
  for (const line of section.slice(at).split('\n')) {
    if (!line.startsWith('|')) break;
    const cell = line.split('|')[1]!.trim();
    if (/^-+$/.test(cell) || cell === '項目') continue;
    out.push(cell);
  }
  return out;
}

const DECLARED = [...DESIGN.matchAll(/^#### (\S+) layer 専用 column/gm)].map((m) => m[1]!);

/** 宣言された全ての列形 (専用 16 + 汎用 1)。 */
const SHAPES: { name: string; columns: string[] }[] = [
  ...DECLARED.map((layer) => ({ name: layer, columns: columnsOf(layer) })),
  { name: '(汎用表)', columns: GENERIC },
];

/** 列並びから 1 行の spec markdown を組む。 各 cell は列名を写した placeholder。 */
function specFor(columns: string[]): string {
  const cell = (name: string): string => {
    // 期待結果と ID は中身を見るので実値を入れる。 残りは列名をそのまま置く。
    if (/^(ID|テスト ID)$/.test(name)) return 'T-SHAPE-001';
    if (/^(Then|Expected|期待結果)$/.test(name)) return 'expected-value';
    if (/^(Priority|優先度)$/.test(name)) return 'P0';
    if (/^(Automation|自動化)$/.test(name)) return 'yes';
    return `<${name}>`;
  };
  return [
    `| ${columns.join(' | ')} |`,
    `|${columns.map(() => '---').join('|')}|`,
    `| ${columns.map(cell).join(' | ')} |`,
    '',
  ].join('\n');
}

describe('宣言された全ての列形を parseSpec が読める', () => {
  it('形を 1 つ以上導けている (空振り防止)', () => {
    // 節の見出しが変わると 0 件になり、 下の it.each が何も見ないまま緑になる。
    expect(SHAPES.length).toBeGreaterThan(1);
    expect(DECLARED.length).toBeGreaterThan(0);
  });

  it.each(SHAPES.map((s) => [s.name, s.columns] as const))('%s', (name, columns) => {
    const doc = parseSpec(specFor(columns));
    expect(doc.cases, `${name}: case を 1 件も読めない (${doc.warnings.join(' / ')})`).toHaveLength(
      1,
    );
    expect(doc.cases[0]?.id).toBe('T-SHAPE-001');
    // 期待結果は列名が 3 通りある (`Then` / `Expected` / `期待結果`)。 どれでも同じ
    // slot に入ることを、 値そのもので確かめる。
    expect(doc.cases[0]?.then, `${name}: 期待結果の列を読めていない`).toBe('expected-value');
    expect(doc.cases[0]?.priority).toBe('P0');
    expect(doc.cases[0]?.automation).toBe('yes');
  });
});

describe('緩めた必須列が恒真になっていない', () => {
  it('期待結果の列を落とすと読めなくなる (陰性対照)', () => {
    // 上の検査は「全形が読める」 を主張する。 必須が 0 列に緩んでいれば恒真になるため、
    // **落とすと読めなくなる列がある** ことを確かめる。
    const columns = columnsOf(DECLARED[0]!).filter((c) => !/^(Then|Expected)$/.test(c));
    const doc = parseSpec(specFor(columns));
    expect(doc.cases, '期待結果を落としても読めてしまう').toEqual([]);
    expect(doc.warnings[0]).toContain('then');
  });

  it('入力列を落としても読める (回帰の向き)', () => {
    // こちらは逆向き。 `given` / `when` を必須に戻すと落ちる。
    const columns = columnsOf(DECLARED[0]!).filter((c) => !/^(Given|When)$/.test(c));
    const doc = parseSpec(specFor(columns));
    expect(doc.cases, '入力列が無いと読めない (必須に戻っている)').toHaveLength(1);
  });
});
