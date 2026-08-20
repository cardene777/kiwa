import { existsSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
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

/** `/kiwa-a11y` Step 3 が axe の runOnly tag へ変換できる WCAG 指定。 */
const A11Y_WCAG_TARGETS = new Set([
  'WCAG 2.0 A',
  'WCAG 2.0 AA',
  'WCAG 2.1 A',
  'WCAG 2.1 AA',
  'WCAG 2.2 AA',
  'best-practice',
]);

/** `@kiwa-lab/a11y` が peer として使う axe-core に実在する rule ID。 */
const A11Y_RULE_IDS = new Set<string>(
  (
    createRequire(resolve(REPO_ROOT, 'packages/a11y/package.json'))('axe-core') as {
      getRules(): { ruleId: string }[];
    }
  )
    .getRules()
    .map((rule) => rule.ruleId),
);

const A11Y_SEVERITIES = new Set(['critical', 'serious', 'moderate', 'minor', '-']);

function isA11yRule(value: string): boolean {
  if (value === '-') return true;
  const normalized = /^`[^`]+`$/.test(value) ? value.slice(1, -1) : value;
  return A11Y_WCAG_TARGETS.has(normalized) || A11Y_RULE_IDS.has(normalized);
}

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
  const patterns = LAYERS.map((layer) => {
    const exact = layer.spec_path
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace('\\{module\\}', '[a-z0-9-]+');
    return {
      id: layer.id,
      exact: new RegExp('^' + exact + '$'),
      // 宣言は英語 (suffix 無し) の形。 実物は言語 suffix を持ちうるので、末尾の
      // `.md` の手前に ISO 639-1 の 2 文字を挟める形にする (#2103)。
      withLang: new RegExp('^' + exact.replace(/\\\.md$/, '\\.[a-z]{2}\\.md') + '$'),
    };
  });
  // 完全一致を全 layer で先に見る。 suffix 無しの integration を先に言語展開すると、
  // `test-spec-counter.ui.md` の `.ui` を言語 code と誤認して ui layer を奪う。
  for (const pattern of patterns) {
    if (pattern.exact.test(rel)) return pattern.id;
  }
  for (const pattern of patterns) {
    if (pattern.withLang.test(rel)) return pattern.id;
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

interface MarkdownTable {
  header: string[];
  separator: string[];
  rows: string[][];
}

function cellsIn(line: string): string[] {
  return line.split('|').slice(1, -1).map((cell) => cell.trim());
}

function separatorMatchesHeader(table: MarkdownTable): boolean {
  return (
    table.separator.length === table.header.length &&
    table.separator.every((cell) => /^-+$/.test(cell))
  );
}

/** `## テストケース一覧` section の先頭にある連続した Markdown 表。 */
function testCaseTable(body: string): MarkdownTable | null {
  const heading = /^## テストケース一覧$/m;
  if (body.search(heading) < 0) return null;
  const section = headingSectionIn(body, heading);
  const lines = section.split('\n');
  const start = lines.findIndex((line) => line.startsWith('|'));
  if (start < 0) return null;
  const tableLines: string[] = [];
  for (const line of lines.slice(start)) {
    if (!line.startsWith('|')) break;
    tableLines.push(line);
  }
  return {
    header: cellsIn(tableLines[0]!),
    separator: tableLines.length > 1 ? cellsIn(tableLines[1]!) : [],
    rows: tableLines.slice(2).map(cellsIn),
  };
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
      const table = testCaseTable(body);
      expect(table, '表の header 行が無い').not.toBeNull();
      expect(
        separatorMatchesHeader(table!),
        '表の区切り行が無い、または header と列数が違う',
      ).toBe(true);
      // 名前が揃っていても順序が違えば別の値を読む。 集合ではなく列で比べる。
      expect(table!.header, `${layer}: 列が宣言と食い違う`).toEqual(requiredColumns(layer!));
    });

    it('`## テストケース一覧` の表が 1 つにまとまっている', () => {
      // Layer 2 は anchor 直後の **連続した 1 表** しか読まない。 観点ごとに小見出しで
      // 割ると、2 表目以降の行は誰にも読まれないまま「仕様に無い」 扱いになる。
      //
      // 実測 (#2103) = 5 spec が 4〜5 表に割れており、16 行のうち 2 行しか読まれない形が
      // あった。 表が 1 つなら header 行も 1 つになるので、その数で見る。
      const section = headingSectionIn(body, /^## テストケース一覧$/m);
      const lines = section.split('\n');
      const headers = lines.filter(
        (line, index) =>
          line.startsWith('|') && /^\|[-| :]+\|$/.test(lines[index + 1] ?? ''),
      );
      expect(
        headers.length,
        '表が 2 つ以上ある (2 表目以降は Layer 2 に読まれない)',
      ).toBe(1);
    });

    it('TC 行が 1 行以上あり、全行が header と同じ列数を持つ', () => {
      const table = testCaseTable(body);
      expect(table, 'テストケース表が無い').not.toBeNull();
      expect(table!.rows.length, 'TC 行が無い').toBeGreaterThan(0);
      const malformed = table!.rows
        .map((row, index) => ({ row: index + 1, columns: row.length }))
        .filter((row) => row.columns !== table!.header.length);
      expect(malformed, 'header と列数が違う TC 行がある').toEqual([]);
    });

    it('a11y 専用列が Layer 2 の解釈できる値を持つ', () => {
      if (layerOf(rel) !== 'a11y') return;
      const table = testCaseTable(body);
      expect(table, 'a11y のテストケース表が無い').not.toBeNull();
      const ruleAt = table!.header.indexOf('WCAG-rule');
      const severityAt = table!.header.indexOf('Severity');
      expect(ruleAt, 'WCAG-rule column が無い').toBeGreaterThanOrEqual(0);
      expect(severityAt, 'Severity column が無い').toBeGreaterThanOrEqual(0);

      const invalidRules = table!.rows
        .map((row) => row[ruleAt]!)
        .filter((value) => !isA11yRule(value));
      expect(invalidRules, 'WCAG-rule が runOnly tag または axe rule ID に変換できない').toEqual(
        [],
      );

      const invalidSeverities = table!.rows
        .map((row) => row[severityAt]!)
        .filter((value) => !A11Y_SEVERITIES.has(value));
      expect(invalidSeverities, 'Severity が axe impact 値でない').toEqual([]);
    });
  },
);

describe('契約の突き合わせ先が実在する', () => {
  it('a11y の WCAG target と実在 rule ID だけを受ける (陰性対照)', () => {
    expect(isA11yRule('WCAG 2.1 AA')).toBe(true);
    expect(isA11yRule('`best-practice`')).toBe(true);
    expect(isA11yRule('`button-name`')).toBe(true);
    expect(isA11yRule('`not-a-real-axe-rule`')).toBe(false);
  });

  it('2 文字の layer suffix を言語 suffix と取り違えない', () => {
    expect(layerOf('tests/spec/integration/test-spec-counter.ui.md')).toBe('ui');
    expect(layerOf('tests/spec/integration/test-spec-counter.ui.ja.md')).toBe('ui');
    expect(layerOf('tests/spec/integration/test-spec-counter.ja.md')).toBe('integration');
  });

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

  it('列不足の TC 行を正常な表とみなさない (陰性対照)', () => {
    const table = testCaseTable(
      '## テストケース一覧\n\n| ID | Given | Then |\n|---|---|---|\n| T-001 | input |\n',
    );
    expect(table).not.toBeNull();
    expect(table!.rows.some((row) => row.length !== table!.header.length)).toBe(true);
  });

  it('区切り行の hyphen 数を 3 個に固定しない (陰性対照)', () => {
    const table = testCaseTable(
      '## テストケース一覧\n\n| ID | Given | Then |\n|-----|----|---|\n| T-001 | input | output |\n',
    );
    expect(table).not.toBeNull();
    expect(separatorMatchesHeader(table!)).toBe(true);
  });
});
