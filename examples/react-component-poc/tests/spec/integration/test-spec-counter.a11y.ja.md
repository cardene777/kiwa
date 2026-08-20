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

| ID | Observation | Component | WCAG-rule | Severity | Expected | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|---|
| T-A11Y-001 | 既定 render の違反 0 件 | `<Counter />` (`context = container`) | WCAG 2.1 AA | - | `violations` が空 | P0 | yes | jsdom |
| T-A11Y-002 | 上限到達時の違反 0 件 | `<Counter initial=2 max=2 />` (`+` が disabled、`role="status"` が出る) | WCAG 2.1 AA | - | `violations` が空 | P0 | yes | jsdom |
| T-A11Y-003 | 検査自身の識別力 | 名前の無い `button` (`context = probe`) | `button-name` | critical | `violations` の id に `button-name` を含む | P0 | yes | jsdom |
| T-A11Y-004 | context の範囲外を拾わない | `<Counter />` + 範囲外に名前の無い `button` (`context = container`) | `button-name` | critical | `violations` が空 | P0 | yes | jsdom |
| T-A11Y-005 | 閾値を省いた時の既定 | `reportViolations` (`minor` 1 件の合成 results) | - | minor | `blocking` が 1 件 (既定は `minor` から塞ぐ) | P0 | yes | jsdom |
| T-A11Y-006 | 閾値を上げると塞がない | `reportViolations` (`maxImpact: 'serious'`) | - | minor | `blocking` が空 | P0 | yes | jsdom |
| T-A11Y-007 | 違反 0 件では送出しない | `expectNoViolations` (違反 0 件の results) | WCAG 2.1 AA | - | 送出しない | P0 | yes | jsdom |
| T-A11Y-008 | context 省略時は document 全体 | 名前の無い `button` (`context` を省く) | `button-name` | critical | `violations` の id に `button-name` を含む | P1 | yes | jsdom |
| T-A11Y-009 | impact が null の扱い | `reportViolations` (`impact` が `null` の合成 results) | - | - | `blocking` が空、`violations` は 1 件 (全件側には残る) | P1 | yes | jsdom |
| T-A11Y-010 | 塞ぐ違反が無い時の文面 | `reportViolations` (blocking 0 件の results) | - | - | summary が `No a11y violations at impact >= "minor".` | P1 | yes | jsdom |
| T-A11Y-011 | summary の件数と内訳 | `reportViolations` (`serious` 1 件の合成 results) | - | serious | summary が件数と `[serious] id: help (1 node(s))` を含む | P1 | yes | jsdom |
| T-A11Y-012 | 違反ありで送出する | `expectNoViolations` (`serious` 1 件の合成 results) | - | serious | `1 a11y violation(s)` を含む `Error` を送出 | P1 | yes | jsdom |
| T-A11Y-013 | 閾値が assertion へ渡る | `expectNoViolations` (`maxImpact: 'critical'`) | - | serious | 送出しない | P1 | yes | jsdom |

## 自動化方針

`@testing-library/react` の `render` で DOM に載せ、`runAxe({ context, runOptions: WCAG_21_AA })`
で対象 subtree を走査する。Vitest は `--environment jsdom` で実行する。

T-A11Y-003 は名前の無い button を走査して `button-name` が出ることを確かめる陰性対照にする。
違反の無い component だけでは、axe が何も走っていない退行を検知できないため。

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
