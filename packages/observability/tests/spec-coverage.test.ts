import { describe, expect, it } from 'vitest';
import { analyzeSpecCoverage } from '../src/index.js';

const spec = `# test-spec-items (api layer)

- module: items
- layer: api

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-001 | a | b | c | d | P0 | yes | live | /api/items |
| T-API-002 | a | b | c | d | P0 | yes | live | /api/items |
| T-API-003 | a | b | c | d | P0 | yes | live | /api/items |
`;

describe('analyzeSpecCoverage', () => {
  it('reports missing TC IDs when test file is empty', () => {
    const gap = analyzeSpecCoverage({ specMarkdown: spec, testCode: '' });
    expect(gap.module).toBe('items');
    expect(gap.layer).toBe('api');
    expect(gap.missingTcIds).toEqual(['T-API-001', 'T-API-002', 'T-API-003']);
    expect(gap.extraTcIds).toEqual([]);
  });

  it('reports no gap when every TC is referenced', () => {
    const test = `it('T-API-001 first', () => {});
it('T-API-002 second', () => {});
it('T-API-003 third', () => {});`;
    const gap = analyzeSpecCoverage({ specMarkdown: spec, testCode: test });
    expect(gap.missingTcIds).toEqual([]);
    expect(gap.extraTcIds).toEqual([]);
  });

  it('reports extra TC IDs not present in spec', () => {
    const test = `it('T-API-001', () => {}); it('T-API-999 stray', () => {});`;
    const gap = analyzeSpecCoverage({ specMarkdown: spec, testCode: test });
    expect(gap.missingTcIds).toEqual(['T-API-002', 'T-API-003']);
    expect(gap.extraTcIds).toEqual(['T-API-999']);
  });
});

/**
 * The 9-column table, which is what `contract` and `e2e` specs actually use.
 *
 * Both id shapes are in the contract: `/kiwa-design` writes `T-API-001` style
 * ids in the per-layer tables and `TC-001` style ids here. Before #1897 the
 * analyser knew only the first, and the parser knew only the English header, so
 * every real spec came back with no cases — which renders identically to full
 * coverage.
 */
const jaSpec = `# test-spec-mint-nft (contract layer)

- module: mint-nft
- layer: contract

対象の関数。

| symbol | kind |
|---|---|
| \`mint(address to)\` | function |

### 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | unit | 正常系 | deploy 済 | to=alice | mint(alice) | alice が 1 枚保有 | P0 | yes |
| TC-002 | unit | 正常系 | deploy 済 | to=bob | mint(bob) | bob が 1 枚保有 | P0 | yes |

### 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-003 | unit | 異常系 | deploy 済 | to=0x0 | mint(0x0) | revert する | P0 | yes |
`;

describe('analyzeSpecCoverage は 9 column 表の spec を読む (#1897)', () => {
  it('日本語 header の spec から case を読む', () => {
    // 実測では `tests/spec/` の 9 spec すべてがこの形で、 英語 header を使う
    // spec は 0 件だった。 それらは `missingTcIds` も `extraTcIds` も空を返し、
    // 「gap 無し」 と区別が付かなかった。
    const gap = analyzeSpecCoverage({ specMarkdown: jaSpec, testCode: '' });
    expect(gap.module).toBe('mint-nft');
    expect(gap.layer).toBe('contract');
    expect(gap.missingTcIds).toEqual(['TC-001', 'TC-002', 'TC-003']);
  });

  it('観点ごとに分かれた表を全部読む', () => {
    // `/kiwa-design` は「観点ごとにグループ化」 と指示するため、 case 表は 1 つ
    // ではない。 実 spec の `mint-nft` は 32 case を 10 表に分けており、 先頭の
    // 1 表だけを読むと 4 件になる。
    const gap = analyzeSpecCoverage({ specMarkdown: jaSpec, testCode: 'TC-001' });
    expect(gap.missingTcIds, '2 表目以降が読めていない').toEqual(['TC-002', 'TC-003']);
  });

  it('case 表の前にある別の表を case 表と取り違えない', () => {
    // 実 spec は contract の関数一覧 (`symbol | kind`) から始まる。 先頭の表を
    // 取る形では、 case 表を持つ document に対して「必要 column が無い」 と
    // 報告していた。
    const gap = analyzeSpecCoverage({ specMarkdown: jaSpec, testCode: '' });
    expect(gap.missingTcIds.length, 'case を 1 件も読めていない').toBeGreaterThan(0);
    expect(gap.missingTcIds, 'symbol 表の行を case として読んでいる').not.toContain('function');
  });

  it('TC-NNN の一部一致を別 case と数えない', () => {
    // `TC-001` を含む文字列は `TC-0012` にもある。 部分一致で数えると、 実装が
    // 無い case を「ある」 と読む。
    const gap = analyzeSpecCoverage({ specMarkdown: jaSpec, testCode: 'TC-0012 TC-002 TC-003' });
    expect(gap.missingTcIds).toEqual(['TC-001']);
    expect(gap.extraTcIds).toEqual(['TC-0012']);
  });

  it('letter 付きの id (TC-E001) も両方向で扱う', () => {
    // `e2e` の spec が使う形。 spec 側は表から読むので形を問わないが、 test 側の
    // 発見は shape を要るため、 両方が同じ形を知っている必要がある。
    const eSpec = jaSpec.replace(/TC-00/g, 'TC-E0');
    const gap = analyzeSpecCoverage({ specMarkdown: eSpec, testCode: 'TC-E01 TC-E99' });
    expect(gap.missingTcIds).toEqual(['TC-E02', 'TC-E03']);
    expect(gap.extraTcIds).toEqual(['TC-E99']);
  });

  it('separator を挟んだ長い id の一部一致を実装済みと読まない', () => {
    // `\b` は `.` と `/` を境界として扱うため、 `TC-001` が `TC-001.2` の中に
    // 一致する。 別 case の id を「実装済み」 と読み、 かつ discovery 側は
    // `TC-001.2` から `TC-001` を切り出して余剰と数えていた (PR #1905 Round 1)。
    const dotted = analyzeSpecCoverage({ specMarkdown: jaSpec, testCode: 'TC-001.2 TC-002 TC-003' });
    expect(dotted.missingTcIds, 'TC-001.2 を TC-001 の実装と読んでいる').toEqual(['TC-001']);
    expect(dotted.extraTcIds, 'TC-001.2 から TC-001 を切り出している').toEqual([]);

    const slashed = analyzeSpecCoverage({
      specMarkdown: jaSpec.replace(/TC-00/g, 'TC/00'),
      testCode: 'X/TC/001 TC/002 TC/003',
    });
    expect(slashed.missingTcIds, 'X/TC/001 を TC/001 の実装と読んでいる').toEqual(['TC/001']);

    // 正確な一致は従来どおり通る。 境界を広げた副作用で実装済みを見落とさない。
    const exact = analyzeSpecCoverage({ specMarkdown: jaSpec, testCode: 'TC-001 TC-002 TC-003' });
    expect(exact.missingTcIds).toEqual([]);
    expect(exact.extraTcIds).toEqual([]);
  });

  it('英語 header の spec が退行しない', () => {
    // 別名を足しただけで、 既存の形は同じ答えを返す。
    const gap = analyzeSpecCoverage({ specMarkdown: spec, testCode: "it('T-API-002', () => {});" });
    expect(gap.missingTcIds).toEqual(['T-API-001', 'T-API-003']);
    expect(gap.extraTcIds).toEqual([]);
  });
});
