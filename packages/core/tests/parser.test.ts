import { describe, expect, it } from 'vitest';
import { parseSpec } from '../src/index.js';

describe('parseSpec', () => {
  it('parses meta + table rows', () => {
    const md = `# test-spec

- module: items
- layer: api

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-001 | 正常系 | DB空 | POST /items | 201 + id返却 | P0 | yes | mock | /api/items |
| T-API-002 | 異常系 | bodyなし | POST /items | 400 | P1 | yes | mock | /api/items |
`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('items');
    expect(doc.layer).toBe('api');
    expect(doc.cases).toHaveLength(2);
    expect(doc.cases[0]?.id).toBe('T-API-001');
    expect(doc.cases[0]?.priority).toBe('P0');
    expect(doc.cases[0]?.automation).toBe('yes');
    expect(doc.cases[0]?.mode).toBe('mock');
    expect(doc.cases[0]?.route).toBe('/api/items');
    expect(doc.warnings).toEqual([]);
  });

  it('falls back to default layer when meta is missing', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | P2 | yes |
`;
    const doc = parseSpec(md, { module: 'fallback', defaultLayer: 'unit' });
    expect(doc.module).toBe('fallback');
    expect(doc.layer).toBe('unit');
    expect(doc.cases).toHaveLength(1);
  });

  it('emits warning when required columns are missing', () => {
    const md = `| ID | Observation |
|---|---|
| T-001 | only obs |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(0);
    expect(doc.warnings.some((w) => w.includes('required columns missing'))).toBe(true);
  });

  it('emits warning for unknown mode but still records the case', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | P2 | yes | weird |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.mode).toBeUndefined();
    expect(doc.warnings.some((w) => w.includes('unknown mode'))).toBe(true);
  });

  it('emits warning when no table is found', () => {
    const doc = parseSpec('- module: x\n- layer: api\n');
    expect(doc.cases).toHaveLength(0);
    expect(doc.warnings).toContain('no test case table found');
  });

  it('T-PARSE-006 priority fallback P2 - unknown priority "foo" → P2', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | foo | yes |
`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.priority).toBe('P2');
  });

  it('T-PARSE-007 priority empty - missing column → P2 fallback', () => {
    const md = `| ID | Observation | Given | When | Then | Automation |
|---|---|---|---|---|---|
| T-001 | a | b | c | d | yes |
`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.priority).toBe('P2');
  });

  it('T-PARSE-008 priority P0/P1/P2/P3 - 全 valid 値 record', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-P0 | a | b | c | d | P0 | yes |
| T-P1 | a | b | c | d | P1 | yes |
| T-P2 | a | b | c | d | P2 | yes |
| T-P3 | a | b | c | d | P3 | yes |
`;
    const doc = parseSpec(md);
    expect(doc.cases.map((c) => c.priority)).toEqual(['P0', 'P1', 'P2', 'P3']);
  });

  it('T-PARSE-009 priority lowercase p0 - uppercase 化で P0 record', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | p0 | yes |
`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.priority).toBe('P0');
  });

  it('T-PARSE-010 automation values - yes / manual / no fallback', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-Y | a | b | c | d | P2 | yes |
| T-M | a | b | c | d | P2 | manual |
| T-N | a | b | c | d | P2 | tbd |
| T-E | a | b | c | d | P2 | |
`;
    const doc = parseSpec(md);
    expect(doc.cases.map((c) => c.automation)).toEqual(['yes', 'manual', 'no', 'no']);
  });

  it('T-PARSE-011 id skip - id 空 / id "-" 始まりは row drop', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
|  | empty-id | b | c | d | P2 | yes |
| -divider | divider | b | c | d | P2 | yes |
| T-001 | valid | b | c | d | P2 | yes |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.id).toBe('T-001');
  });

  it('T-PARSE-012 mode valid - mock / live / hybrid 全 record', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-MO | a | b | c | d | P2 | yes | mock |
| T-LI | a | b | c | d | P2 | yes | live |
| T-HY | a | b | c | d | P2 | yes | hybrid |
`;
    const doc = parseSpec(md);
    expect(doc.cases.map((c) => c.mode)).toEqual(['mock', 'live', 'hybrid']);
    expect(doc.warnings).toEqual([]);
  });

  it('T-PARSE-013 mode empty - mode column 空欄は warning なし', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | P2 | yes |  |
`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.mode).toBeUndefined();
    expect(doc.warnings.filter((w) => w.includes('unknown mode'))).toEqual([]);
  });

  it('T-PARSE-014 unknown layer - meta "layer: xxx" は warning 出して default layer 採用', () => {
    const md = `- module: items
- layer: zzz

| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | P2 | yes |
`;
    const doc = parseSpec(md, { defaultLayer: 'unit' });
    expect(doc.layer).toBe('unit');
    expect(doc.warnings.some((w) => w.includes('unknown layer'))).toBe(true);
  });

  it('T-PARSE-015 valid layers - contract / unit / integration / e2e / api / ui / data / cli', () => {
    const layers = ['contract', 'unit', 'integration', 'e2e', 'api', 'ui', 'data', 'cli'];
    for (const layer of layers) {
      const md = `- layer: ${layer}\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
      const doc = parseSpec(md);
      expect(doc.layer).toBe(layer);
    }
  });

  it('T-PARSE-016 case-insensitive layer - "API" → "api"', () => {
    const md = `- layer: API\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.layer).toBe('api');
  });

  it('T-PARSE-017 module from opts overrides meta line', () => {
    const md = `- module: from-meta\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md, { module: 'from-opts' });
    expect(doc.module).toBe('from-opts');
  });

  it('T-PARSE-018 module from meta when opts.module empty', () => {
    const md = `- module: from-meta\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('from-meta');
  });

  it('T-PARSE-019 module default empty string', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('');
  });

  it('T-PARSE-020 raw field - returned as-is from markdown input', () => {
    const md = `| ID |\n|---|\n`;
    const doc = parseSpec(md);
    expect(doc.raw).toBe(md);
  });

  it('T-PARSE-021 meta line - "*" prefix も "-" prefix も同等 parse', () => {
    const md = `* module: starred\n* layer: ui\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('starred');
    expect(doc.layer).toBe('ui');
  });

  it('T-PARSE-022 meta line - 全角コロン (":") も半角と同等 parse', () => {
    const md = `- module: jp-colon\n- layer: data\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('jp-colon');
    expect(doc.layer).toBe('data');
  });

  it('T-PARSE-023 table header divider - colon-cell ":---:" でも認識', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
  });

  it('T-PARSE-024 empty rows after table - stop processing', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n\n| ID | Observation |\n|---|---|\n`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
  });

  it('T-PARSE-025 notes column - HEADER_KEYS にない notes は無視 (route のみ記録)', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation | Route | Notes |\n|---|---|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes | /x | memo |\n`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.route).toBe('/x');
    expect(doc.cases[0]?.notes).toBeUndefined();
  });

  it('T-PARSE-026 route empty - route 列空欄なら .route undefined', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation | Route |\n|---|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |  |\n`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.route).toBeUndefined();
  });

  it('T-PARSE-027 layer recognition - both upper and lowercase + meta order independence', () => {
    const md1 = `- layer: UI\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const md2 = `- module: x\n- layer: cli\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    expect(parseSpec(md1).layer).toBe('ui');
    expect(parseSpec(md2).layer).toBe('cli');
  });

  it('T-PARSE-028 row with extra leading/trailing | 文字 - splitRow が trim する', () => {
    const md = `|ID|Observation|Given|When|Then|Priority|Automation|\n|---|---|---|---|---|---|---|\n|T-001|a|b|c|d|P2|yes|\n`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.id).toBe('T-001');
  });

  it('T-PARSE-029 layer default - opts/meta なしなら "unit"', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.layer).toBe('unit');
  });

  it('T-PARSE-030 header missing - findTable returned but headerRow missing (edge case)', () => {
    const md = `\n|---|\n`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(0);
  });

  it('T-PARSE-031 CRLF line ending - \\r\\n でも parse', () => {
    const md = `- module: crlf\r\n- layer: api\r\n\r\n| ID | Observation | Given | When | Then | Priority | Automation |\r\n|---|---|---|---|---|---|---|\r\n| T-001 | a | b | c | d | P2 | yes |\r\n`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('crlf');
    expect(doc.cases).toHaveLength(1);
  });

  it('T-PARSE-032 priority specific - P3 record (boundary between known/unknown)', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P3 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.priority).toBe('P3');
  });

  it('T-PARSE-033 automation manual - explicit "manual" record', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | manual |\n`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.automation).toBe('manual');
  });

  it('T-PARSE-034 non-pipe line after divider stops the row scan (pre-empty guard)', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
prose paragraph without pipe
| T-001 | a | b | c | d | P2 | yes |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(0);
    expect(doc.warnings).toEqual([]);
  });

  it('T-PARSE-035 short row (fewer cells than header) uses "" fallback for missing tail cells', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-001 | a | b | c | d |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.id).toBe('T-001');
    expect(doc.cases[0]?.then).toBe('d');
    expect(doc.cases[0]?.priority).toBe('P2');
    expect(doc.cases[0]?.automation).toBe('no');
  });
});

/**
 * 実 spec の形。
 *
 * `/kiwa-design` は per-layer 表 (`api` / `ui` / `data` / `cli`) を英語 header
 * で、 一般 9 column 表 (`contract` と `e2e` が使う) を日本語 header で書く。
 * parser は前者しか知らず、 かつ file 内で最初の表を case 表とみなしていたため、
 * `tests/spec/` の 9 spec すべてで case 0 件を返していた (#1897)。
 */
describe('parseSpec は 9 column 表 (日本語 header) を読む', () => {
  const jaTable = (id: string): string =>
    `| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| ${id} | unit | 正常系 | deploy 済 | to=alice | mint(alice) | alice が 1 枚保有 | P0 | yes |
`;

  it('T-PARSE-036 日本語 header を canonical column に対応させる', () => {
    const doc = parseSpec(jaTable('TC-001'));
    expect(doc.warnings).toEqual([]);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]).toMatchObject({
      id: 'TC-001',
      observation: '正常系',
      given: 'deploy 済',
      when: 'mint(alice)',
      then: 'alice が 1 枚保有',
      priority: 'P0',
      automation: 'yes',
    });
  });

  it('T-PARSE-037 テスト ID の内部空白の有無を問わない', () => {
    // label は手書きの markdown table にあり、 空白は表記の選択でしかない。
    const doc = parseSpec(jaTable('TC-001').replace('テスト ID', 'テストID'));
    expect(doc.cases[0]?.id).toBe('TC-001');
  });

  it('T-PARSE-038 case 表の前にある別の表を case 表と取り違えない', () => {
    // 実 spec は contract の関数一覧から始まる。 先頭の表を取る形では、 case 表を
    // 持つ document に対して「必要 column が無い」 と報告していた。
    const md = `| symbol | kind |
|---|---|
| \`mint(address to)\` | function |

${jaTable('TC-001')}`;
    const doc = parseSpec(md);
    expect(doc.warnings).toEqual([]);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.id).toBe('TC-001');
  });

  it('T-PARSE-039 観点ごとに分かれた表を全部読む', () => {
    // 「観点ごとにグループ化」 は `/kiwa-design` の指示で、 case 表は 1 つではない。
    // 実 spec の `mint-nft` は 32 case を 10 表に分けている。
    const md = `${jaTable('TC-001')}
### 異常系

${jaTable('TC-002')}
### 境界値

${jaTable('TC-003')}`;
    const doc = parseSpec(md);
    expect(doc.cases.map((c) => c.id)).toEqual(['TC-001', 'TC-002', 'TC-003']);
  });

  it('T-PARSE-040 表ごとに column 位置を読み直す', () => {
    // 2 つ目の表が別の順序で書かれていても、 1 つ目の index で読まない。
    const md = `${jaTable('TC-001')}
| テスト観点 | テスト ID | 前提条件 | 操作手順 | 期待結果 |
|---|---|---|---|---|
| 異常系 | TC-002 | deploy 済 | mint(0x0) | revert する |
`;
    const doc = parseSpec(md);
    expect(doc.cases.map((c) => c.id)).toEqual(['TC-001', 'TC-002']);
    expect(doc.cases[1]?.then).toBe('revert する');
  });

  it('T-PARSE-041 case 表が 1 つも無い時は不足 column を報告する', () => {
    // 「表が 1 つも無い」 と「表はあるが case 表ではない」 は書き手にとって別の話。
    const md = `| symbol | kind |
|---|---|
| \`mint(address to)\` | function |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toEqual([]);
    expect(doc.warnings[0]).toContain('required columns missing');
    expect(doc.warnings[0]).toContain('id');
  });

  it('T-PARSE-042 表が 1 つも無い時は従来どおり報告する', () => {
    const doc = parseSpec('# spec\n\n本文だけ。\n');
    expect(doc.warnings).toEqual(['no test case table found']);
  });

  it('T-PARSE-043 英語 header が退行しない', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-001 | a | b | c | d | P0 | yes | live | /api/items |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.id).toBe('T-API-001');
    expect(doc.cases[0]?.mode).toBe('live');
    expect(doc.cases[0]?.route).toBe('/api/items');
  });
});

/**
 * 入力側の列名が layer ごとに違う形を読めるか (#2072)。
 *
 * `/kiwa-design` は 16 の layer 専用表と汎用表の 17 形を書く。 入力側は layer 固有で、
 * `given` と `when` を両方持つのは 8 形だけ。 必須をその 2 つに置いていた間、
 * 残り 9 形が `required columns missing` で 0 件になり、 `analyzeSpecCoverage` は
 * どの gap も判定できなかった。
 *
 * 必須は `id` / `observation` / `then` の 3 つ。 欠けた入力列は空文字で読む。
 */
describe('parseSpec は layer 固有の入力列を読む', () => {
  it('T-PARSE-044 given / when が無い形でも case を読む (nextjs-server-action)', () => {
    const md = `| ID | Observation | Given | FormData | Args | Then | Priority | Automation | Action |
|---|---|---|---|---|---|---|---|---|
| T-NA-001 | 正常系 | 未ログイン | title=hi | [] | result.ok === true | P0 | yes | createItem |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.id).toBe('T-NA-001');
    expect(doc.cases[0]?.then).toBe('result.ok === true');
    // 列が無い側は空文字。 `undefined` にすると型が変わり、 読む側が分岐を持つ。
    expect(doc.cases[0]?.when).toBe('');
    expect(doc.warnings).toEqual([]);
  });

  it('T-PARSE-045 given も when も無い形を読む (nextjs-parallel-route)', () => {
    const md = `| ID | Observation | Layout | Slots | Children | Then | Priority | Automation | Variant |
|---|---|---|---|---|---|---|---|---|
| T-PR-001 | 全 slot render | DashboardLayout | [modal] | PostsPage | tree.tag === 'layout' | P0 | yes | none |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.given).toBe('');
    expect(doc.cases[0]?.when).toBe('');
    expect(doc.cases[0]?.then).toBe("tree.tag === 'layout'");
  });

  it('T-PARSE-046 Expected 列を期待結果として読む (a11y)', () => {
    const md = `| ID | Observation | Component | WCAG-rule | Severity | Expected | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|---|
| T-A11Y-001 | 既定 render | Counter | WCAG 2.1 AA | serious | violations 0 件 | P0 | yes | jsdom |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.then).toBe('violations 0 件');
  });

  it('T-PARSE-047 then が無い表は依然として case 表とみなさない', () => {
    // 必須を緩めたが 0 にはしていない。 期待結果を持たない表を case 表と読むと、
    // 目次や観点一覧の表から case を作ることになる。
    const md = `| ID | Observation | Given | When | Priority |
|---|---|---|---|---|
| T-X-001 | a | b | c | P0 |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toEqual([]);
    expect(doc.warnings[0]).toBe('required columns missing: then');
  });

  it('T-PARSE-048 observation が無い表も case 表とみなさない', () => {
    const md = `| ID | Given | When | Then | Priority |
|---|---|---|---|---|
| T-X-001 | a | b | c | P0 |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toEqual([]);
    expect(doc.warnings[0]).toBe('required columns missing: observation');
  });
});
