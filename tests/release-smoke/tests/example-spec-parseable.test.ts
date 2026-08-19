import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, headingSectionIn, read, skillBody } from './skill-md.js';

/**
 * `examples/` の spec を Layer 2 が実際に parse できるか (#2070)。
 *
 * Layer 2 skill は `## テストケース一覧` を anchor に表を探し、 **column index で列を読む**。
 * anchor が無ければ 0 行、 列の順序が違えば別の値を読む。 どちらも spec を置いた側からは
 * 成功に見える。
 *
 * 実測で 14 件中 9 件が parse 不能だった = anchor 無しが 9 件、 うち 1 件は列の順序違い
 * (`a11y` の `Mode` が 3 番目)、 2 件は列の組が別 layer のものだった。
 *
 * #2062 で同じ形を 1 度踏んでいる (spec を置いただけで Layer 2 が読めなかった)。
 * その時は nextjs 5 件を手で直しただけで、 **他の example に同じ形が残っていることに
 * 気付いていなかった**。
 */

const DESIGN = skillBody('kiwa-design');

const LAYERS = (JSON.parse(read('docs/layers.json')) as {
  layers: { id: string; spec_path: string }[];
}).layers;

/** 汎用 9 column 表 (日本語列) を使う layer。 `skill-column-table-ssot` の GENERIC と同じ集合。 */
const GENERIC_COLUMNS = [
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

/** `#### {layer} layer 専用 column` 節が定義する列。 無ければ汎用表。 */
function requiredColumns(layer: string): string[] {
  const heading = new RegExp(`^#### ${layer} layer 専用 column`, 'm');
  if (DESIGN.search(heading) < 0) return GENERIC_COLUMNS;
  const section = headingSectionIn(DESIGN, heading);
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

/**
 * spec の path から layer を引く。
 *
 * `docs/layers.json` の `spec_path` を **placeholder ごと正規表現へ変換して** 突き合わせる。
 * suffix の対応表を手で持つと layer が増えた時にそこだけ古くなる。
 */
function layerOf(rel: string): string | null {
  for (const l of LAYERS) {
    const pattern = new RegExp(
      '^' +
        l.spec_path
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace('\\{module\\}', '[a-z0-9-]+') +
        '$',
    );
    if (pattern.test(rel)) return l.id;
  }
  return null;
}

/** `examples/` 配下の spec を、 JS/TS example に限って列挙する。 */
function specFiles(): { file: string; example: string; rel: string }[] {
  const root = resolve(REPO_ROOT, 'examples');
  const out: { file: string; example: string; rel: string }[] = [];
  for (const example of readdirSync(root)) {
    const specRoot = join(root, example, 'tests', 'spec');
    if (!existsSync(specRoot)) continue;
    // Python 等の例は layer 体系の外にある (`docs/layers.json` の runtime は
    // solidity / typescript の 2 つだけ)。 `package.json` の有無で分ける。
    if (!existsSync(join(root, example, 'package.json'))) continue;
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (entry.endsWith('.md')) {
          out.push({
            file: full,
            example,
            rel: full.slice(join(root, example).length + 1),
          });
        }
      }
    };
    walk(specRoot);
  }
  return out;
}

const SPECS = specFiles();

/** 表の header 行 (最初の `|` 始まりで区切り行でない行) の列。 */
function headerColumns(body: string): string[] | null {
  const at = body.indexOf('## テストケース一覧');
  if (at < 0) return null;
  for (const line of body.slice(at).split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.every((c) => /^-+$/.test(c))) continue;
    return cells;
  }
  return null;
}

describe('examples の spec が Layer 2 の parse 契約を満たす', () => {
  it('spec を 1 件以上見つけている (空振り防止)', () => {
    // 走査に失敗すると下の describe.each が 0 件になり、 全部緑のまま何も見ない。
    expect(SPECS.length).toBeGreaterThan(0);
  });

  it('全 spec の layer を path から引ける', () => {
    // 引けない spec は宣言に無い場所に置かれている = Layer 2 は `kiwa layers` が返す
    // path しか読まないため、 その spec は誰にも読まれない。
    const orphan = SPECS.filter((s) => layerOf(s.rel) === null).map((s) => `${s.example}/${s.rel}`);
    expect(orphan, '宣言に無い場所に置かれた spec がある').toEqual([]);
  });
});

describe.each(SPECS.map((s) => [`${s.example}/${s.rel}`, s.file, s.rel] as const))(
  '%s',
  (_label, file, rel) => {
    const body = read(file.slice(REPO_ROOT.length + 1));

    it('`## テストケース一覧` を持つ', () => {
      // anchor が無いと Layer 2 は 0 行になる。 「表がある」 だけでは足りない。
      expect(body, 'anchor が無い (Layer 2 は 1 行も parse できない)').toContain(
        '## テストケース一覧',
      );
    });

    it('列が layer の宣言と順序まで一致する', () => {
      const layer = layerOf(rel);
      expect(layer, 'layer を引けない').not.toBeNull();
      const actual = headerColumns(body);
      expect(actual, '表の header 行が無い').not.toBeNull();
      // 名前が揃っていても順序が違えば別の値を読む。 集合ではなく列で比べる。
      expect(actual, `${layer}: 列が宣言と食い違う`).toEqual(requiredColumns(layer!));
    });

    it('TC 行が 1 行以上ある', () => {
      const at = body.indexOf('## テストケース一覧');
      const rows = body
        .slice(at)
        .split('\n')
        .filter((l) => l.startsWith('|'))
        .filter((l) => !l.split('|').slice(1, -1).every((c) => /^-+$/.test(c.trim())));
      // header の 1 行しか無い spec は「表がある」 が中身が無い。
      expect(rows.length, 'TC 行が無い').toBeGreaterThan(1);
    });
  },
);

describe('契約の突き合わせ先が実在する', () => {
  it('汎用列が output-skeleton の雛形と一致する (陰性対照)', () => {
    // 上の検査は「宣言と一致する」 を主張する。 宣言側を取り違えていれば恒真になるため、
    // 汎用列を **別の SSOT** (雛形) からも引いて一致を確かめる。
    const skeleton = read('.claude/skills/kiwa-design/references/output-skeleton.md');
    const row = skeleton.split('\n').find((l) => l.startsWith('| テスト ID |'));
    expect(row, '雛形に汎用表が無い').toBeTruthy();
    expect(row!.split('|').slice(1, -1).map((c) => c.trim())).toEqual(GENERIC_COLUMNS);
  });

  it('layer 専用列を持つ spec が 1 件以上ある (空振り防止)', () => {
    // 全 spec が汎用表だと、 順序の検査は汎用列としか突き合わせない。
    const specific = SPECS.filter((s) => {
      const layer = layerOf(s.rel);
      return layer !== null && requiredColumns(layer) !== GENERIC_COLUMNS;
    });
    expect(specific.length).toBeGreaterThan(0);
  });
});
