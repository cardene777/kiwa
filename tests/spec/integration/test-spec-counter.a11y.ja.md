<!-- kiwa-layers: source=all layers=a11y -->

# test-spec-counter.a11y

- module: counter
- layer: a11y
- 対象実装: `packages/a11y/src/audit.ts` (検査の仕組み) / `examples/react-component-poc/src/counter.tsx` (被検査 component)

## 対象機能

axe-core を jsdom 上で走らせ、違反を閾値で仕分けて報告する 3 関数。

`a11y` layer が見るのは **2 つ** ある。被検査 component (`Counter`) に違反が無いことと、
検査の仕組み (`runAxe` / `reportViolations` / `expectNoViolations`) が期待どおり働くこと。

後者を落とすと、axe が実際には何も走っていなくても全 TC が通る。
「違反が無い」 と「検査していない」 は同じ緑に見える。

## 仕様の要約

### API 契約

| 関数 | 引数 | 返り値 |
|---|---|---|
| `runAxe(opts?)` | `opts.context?`、`opts.runOptions?` | `Promise<AxeResults>` |
| `reportViolations(results, opts?)` | `opts.maxImpact?` | `ViolationReport` |
| `expectNoViolations(results, expect, opts?)` | 同上 + assertion 関数 | `void` (違反ありで送出) |

`ViolationReport` は `{ violations, blocking, summary }`。

### 走査範囲の決め方

`runAxe` は `opts.context` を優先し、無ければ `document` 全体を走査する。
どちらも無い環境 (jsdom でない) では `runAxe: no context and no global document (jsdom env required).` を投げる。

**範囲を絞ることが検査の意味を決める**。`context` を渡さないと、対象の外にある違反まで拾う。

### 閾値による仕分け

`impact` の順序は `minor` < `moderate` < `serious` < `critical`。
`maxImpact` の既定は **`minor`** で、`minor` も blocking に入る。

「`serious` 以上だけ落ちる」 と読むと、`minor` を残したまま緑だと誤解する。

`impact` を持たない違反 (`null`) は blocking に **入らない**。
ただし `violations` (全件) には残るため、閾値で絞った結果と全件は別に読む。

### summary の形

| blocking | summary |
|---|---|
| 0 件 | `No a11y violations at impact >= "minor".` |
| 1 件以上 | `1 a11y violation(s) at impact >= "minor":` に続けて `  - [serious] id: help (1 node(s))` を並べる |

閾値を文面に含めるのは、どの基準で 0 件なのかが読み手に伝わらないため。

### `expectNoViolations` の送出

blocking が 1 件以上なら `summary` を message にして `Error` を投げる。
0 件なら渡された assertion 関数に `0` を渡す。

assertion 関数を注入で受けるのは、test runner に依存しないため。

### 権限モデル

なし。

### 失敗 mode

| 状況 | 送出 |
|---|---|
| `axe-core` が読めない | <code>runAxe requires "axe-core" to be installed. Run &#96;pnpm add -D axe-core&#96;.</code> |
| `context` も `document` も無い | `runAxe: no context and no global document (jsdom env required).` |
| blocking が 1 件以上 (`expectNoViolations`) | `Error(summary)` |

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| 検査自身の識別力 | 低 | 低 | 低 | 高 | 低 | axe が走っていなくても違反 0 件に見えるため、緑が意味を失う |
| 走査範囲の指定 | 低 | 低 | 低 | 高 | 低 | 範囲外の違反を拾うと、対象と無関係な理由で落ちる |
| 閾値の既定 | 低 | 中 | 低 | 高 | 低 | 既定を誤解すると `minor` を残したまま緑と読む |
| 状態変化後の検査 | 低 | 中 | 低 | 中 | 低 | 名前や role の付き方は状態で変わるため、初期状態だけでは覆えない |

## 推奨テスト構成

| layer | 目的 | 観点 |
|---|---|---|
| 結合 (vitest + jsdom + axe-core) | component の違反 0 と、検査の仕組みの分岐を確かめる | 正常系 / 異常系 / 境界値 |

`color-contrast` は無効にする。
jsdom は layout と canvas を持たないため、実 browser を要する rule は Playwright 側で扱う。

対象は WCAG 2.1 AA まで (`wcag2a` / `wcag2aa` / `wcag21a` / `wcag21aa`)。

## テスト観点一覧

- 1. 正常系 — 適用 (違反 0 の確認)
- 2. 異常系 — 適用 (違反ありの検出 / 送出)
- 3. 境界値 — 適用 (閾値の既定と引き上げ / `impact` なし)
- 4. 状態遷移 — 適用 (max 到達で role が変わる)
- 5. 権限 — 非適用
- 6. 入力バリデーション — 非適用
- 7. 冪等性 — 非適用
- 8. 並行処理 — 非適用
- 9. 性能 — 非適用
- 10. セキュリティ — 非適用

## テストケース一覧

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-A11Y-001 | 結合 | 正常系 | `Counter` を既定 prop で render | `context = container` | `runAxe(...)` | `violations` が空 | 高 | 推奨 |
| T-A11Y-007 | 結合 | 正常系 | 違反 0 件の results | assertion 関数を注入 | `expectNoViolations(...)` | 送出しない | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-A11Y-003 | 結合 | 異常系 | 名前の無い `button` を body に置く | `context = probe` | `runAxe(...)` | `violations` の id に `button-name` を含む (**検査自身の識別力**) | 高 | 推奨 |
| T-A11Y-011 | 結合 | 異常系 | `serious` 1 件の合成 results | 既定の閾値 | `reportViolations(...)` | summary が件数と `[serious] id: help (1 node(s))` を含む | 中 | 推奨 |
| T-A11Y-012 | 結合 | 異常系 | 同上 | assertion 関数を注入 | `expectNoViolations(...)` | `1 a11y violation(s)` を含む `Error` を送出 | 中 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-A11Y-005 | 結合 | 境界値 | `minor` 1 件の合成 results | 閾値を省く | `reportViolations(...)` | `blocking` が 1 件 (既定は `minor` から塞ぐ) | 高 | 推奨 |
| T-A11Y-006 | 結合 | 境界値 | 同上 | `maxImpact: 'serious'` | `reportViolations(...)` | `blocking` が空 | 高 | 推奨 |
| T-A11Y-009 | 結合 | 境界値 | `impact` が `null` の合成 results | 既定の閾値 | `reportViolations(...)` | `blocking` が空、`violations` は 1 件 (全件側には残る) | 中 | 推奨 |
| T-A11Y-010 | 結合 | 境界値 | blocking 0 件になる results | 既定の閾値 | `reportViolations(...)` | summary が `No a11y violations at impact >= "minor".` | 中 | 推奨 |
| T-A11Y-013 | 結合 | 境界値 | `serious` 1 件の合成 results | `maxImpact: 'critical'` | `expectNoViolations(...)` | 送出しない (閾値が渡ることの確認) | 中 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-A11Y-002 | 結合 | 状態遷移 | `initial=2, max=2` で render (`+` が disabled、`role="status"` が出る) | `context = container` | `runAxe(...)` | `violations` が空 | 高 | 推奨 |

### 走査範囲

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-A11Y-004 | 結合 | 正常系 | `Counter` を render し、**範囲外** に名前の無い `button` を置く | `context = container` | `runAxe(...)` | `violations` が空 (範囲外を拾わない) | 高 | 推奨 |
| T-A11Y-008 | 結合 | 境界値 | body に名前の無い `button` を置く | `context` を省く | `runAxe(...)` | `violations` の id に `button-name` を含む (`document` 全体に落ちる) | 中 | 推奨 |

## 自動化すべきテスト

- T-A11Y-001 〜 T-A11Y-013 全 13 件、全件自動化推奨
- 合成 results を使う 7 件 (005 / 006 / 009 / 010 / 011 / 012 / 013) は axe を通さず閾値の分岐だけを見る

## 手動確認でよいテスト

- (なし)

## 不足している仕様

- この counter suite には、`axe-core` を読めない場合の送出 (`runAxe requires "axe-core" to be installed.` で始まる error) を確かめる経路が無い。依存を外して走らせる形になるため、単体の test では再現しにくい
- この counter suite には、`context` も `document` も無い場合の送出を確かめる経路が無い。jsdom 環境では `document` が常にあるため、node 環境で走らせる別の test が要る
- この counter suite では `color-contrast` を無効にしているため、実 browser を要する rule が 1 件も走らない。どの rule を Playwright 側へ回すかの一覧が未定義
- この counter suite には、`impact` の 4 段階のうち `moderate` を通す TC が無い。`minor` と `serious` の境界は確かめているが、中間の順序は暗黙のまま
- この counter suite で `runAxe` を呼ぶ全 TC が `WCAG_21_AA` を渡しており、`runOptions` を省いた場合の既定 (`{}` = 全 rule) を確かめる TC が無い

## Layer 2 連携

```text
/kiwa-a11y --module counter --layer a11y --lang ja
```
