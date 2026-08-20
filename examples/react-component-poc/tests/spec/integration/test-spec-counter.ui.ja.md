<!-- kiwa-layers: source=flag layers=ui -->

# test-spec-counter (ui layer)

- module: counter
- layer: ui
- 対象実装: `examples/react-component-poc/src/counter.tsx`

## 対象機能

`Counter` — `initial` / `step` / `max` の 3 prop を取る React component。

`+` を押すと `step` ずつ増え、 `reset` で `initial` に戻る。
`max` を渡した場合、 現在値が `max` 以上になった時点で `+` が無効化され、 「max reached」 の status が出る。

| prop | 既定 | 役割 |
|---|---|---|
| `initial` | `0` | 初期値。 `reset` の戻り先も兼ねる |
| `step` | `1` | `+` 1 回あたりの増分 |
| `max` | (なし) | 到達すると `+` が無効化される上限。 未指定なら無効化しない |

## 仕様の要約

### ユーザー操作

- `+` を押して値を増やす
- `reset` を押して初期値に戻す

### API 契約 (HTTP / RPC)

該当なし (React component、 HTTP endpoint を持たない)。

### DB / State 更新

| Table / State | 触れる column | tx 境界 |
|---|---|---|
| `useState(count)` | 値 1 つ | `+` / `reset` の click ごと |

外部 store を持たず、 component 内の state だけで閉じる。

### 権限モデル

該当なし (認証 / role の概念を持たない)。

### 外部連携

該当なし。 network / storage のいずれにも触れない。

### 失敗 mode

例外を投げる経路を持たない。
`max` 到達時は `+` が `disabled` になるため、 click 自体が発生しない。

## 主な品質リスク

| 基準 | スコア | 根拠 1 文 |
|---|---|---|
| 売上影響 | 低 | 例として置いた component で、 収益経路に乗らない |
| セキュリティ影響 | 低 | 外部入力を実行せず、 network / storage に触れない |
| データ破壊リスク | 低 | state は component 内に閉じ、 永続化しない |
| 利用頻度 | 中 | `@kiwa-lab/ui` の 3 mode を通す例として毎回使われる |
| 過去障害履歴 | 低 | 該当 component の bug 報告なし |

**総合リスク = 低**。

ただし本 component は **`@kiwa-lab/ui` の 3 mode (render / interaction / snapshot) を通す唯一の例**で、
ここが緩むと 3 mode の回帰を検知する経路が無くなる。

## 推奨テスト構成

| 層 | 方針 |
|---|---|
| 単体 (UI) | 3 mode すべて。 表示 / 操作後の値 / 無効化 / status の有無を別々に見る |
| 統合 | 不要 (外部依存を持たない) |
| E2E | 不要 |

## テスト観点一覧

| # | 観点 | 適用理由 |
|---|---|---|
| 1 | 正常系 | 常に |
| 3 | 境界値 | `max` 到達の前後が分岐する |
| 4 | 状態遷移 | click と reset で値が動き、 無効化状態が切り替わる |

`2 異常系` は例外経路を持たないため除外。
`5 権限` / `6 入力バリデーション` / `7 冪等性` / `8 並行処理` / `9 性能` / `10 セキュリティ` は
§ 主な品質リスク のとおり該当しない。
`11 回帰` は既存 test 7 件が存在するが、 過去 bug fix の再発防止を目的とする case が無いため今回は対象外。

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Component |
|---|---|---|---|---|---|---|---|---|
| T-UI-001 | 初期 render | `initial=3` | mount Counter | `value` が `"3"` を表示 | P0 | yes | render | Counter |
| T-UI-002 | step 指定時の初期表示 | `initial=0, step=5` | mount Counter | `value` が `"0"` を表示 (step は初期値に影響しない) | P1 | yes | render | Counter |
| T-UI-003 | max 未到達時の status | `initial=0, max=2` | mount Counter | `role="status"` の要素が存在しない | P1 | yes | render | Counter |
| T-UI-004 | 初期値が max 以上 | `initial=2, max=2` | mount Counter | `+` が最初から `disabled` | P0 | yes | render | Counter |
| T-UI-005 | 1 クリックの加算 | 既定 prop | click `+` | `value` が `"1"` になる | P0 | yes | interaction | Counter |
| T-UI-006 | 連続クリック | 既定 prop | click `+` × 3 | `value` が `"3"` になる | P0 | yes | interaction | Counter |
| T-UI-007 | step を指定した加算 | `initial=0, step=5` | click `+` | `value` が `"5"` になる | P0 | yes | interaction | Counter |
| T-UI-008 | reset の戻り先 | `initial=5` | click `+` × 3 → click `reset` | `value` が `"5"` に戻る | P0 | yes | interaction | Counter |
| T-UI-009 | max 到達で無効化 | `initial=0, max=2` | click `+` × 2 | `+` が `disabled` になる | P0 | yes | interaction | Counter |
| T-UI-010 | max 到達で status 表示 | `initial=0, max=2` | click `+` × 2 | `role="status"` が `"max reached"` を表示 | P0 | yes | interaction | Counter |
| T-UI-011 | max 到達後の reset | `initial=0, max=2` | click `+` × 2 → click `reset` | `+` が再び有効になる | P1 | yes | interaction | Counter |
| T-UI-012 | markup の値 | `initial=7` | mount Counter | markup に `data-testid="value"` と `>7<` が含まれる | P1 | yes | snapshot | Counter |
| T-UI-013 | markup のボタン | `initial=7` | mount Counter | markup に `aria-label="increment"` と `aria-label="reset"` が含まれる | P1 | yes | snapshot | Counter |
| T-UI-014 | max 到達時の markup | `initial=2, max=2` | mount Counter | markup に `role="status"` が含まれる | P1 | yes | snapshot | Counter |

## 自動化方針

- `render` は `setupComponentEnv({ mode: 'render', ui: <Counter /> })` と screen query で検証する
- `interaction` は `setupComponentEnv({ mode: 'interaction', ui: <Counter /> })` と `env.user.click()` で操作する
- `snapshot` は `setupComponentEnv({ mode: 'snapshot', ui: <Counter /> })` の `env.markup` を部分一致で検証する。file snapshot の保存は別 phase とする

## 既存 test との対応

`/kiwa-design` § Step 2 § 既存 test の探索 の実測結果と、 § テストケース一覧 の全 TC を突き合わせた結果。

- 探索した runtime — `typescript` (`docs/layers.json` の `ui` layer)
- 探索した path — `examples/react-component-poc/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` は除外)。 見つかったのは `tests/` のみ
- 見つけた既存 test — 10 件 (`describe` 3 + `it` 7)

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-UI-001 | `T-UI-001 初期 render: initial=3 で value が "3"` (`examples/react-component-poc/tests/counter.test.tsx:15`) | 既覆 (候補) |
| T-UI-002 | `T-UI-002 step 反映: initial=0 step=5 で value が "0"` (`examples/react-component-poc/tests/counter.test.tsx:22`) | 既覆 (候補) |
| T-UI-003 | (なし) | 未覆 |
| T-UI-004 | (なし) | 未覆 |
| T-UI-005 | `T-UI-003 + クリックで value が "1"` (`examples/react-component-poc/tests/counter.test.tsx:34`) | 既覆 (候補) |
| T-UI-006 | `T-UI-004 連続クリック × 3 で value が "3"` (`examples/react-component-poc/tests/counter.test.tsx:42`) | 既覆 (候補) |
| T-UI-007 | (なし) | 未覆 |
| T-UI-008 | `T-UI-005 reset で initial に戻る` (`examples/react-component-poc/tests/counter.test.tsx:53`) | 既覆 (候補) |
| T-UI-009 | `T-UI-006 max 到達で + ボタンが disabled になり status が表示される` (`examples/react-component-poc/tests/counter.test.tsx:66`) | 既覆 (候補) |
| T-UI-010 | `T-UI-006 max 到達で + ボタンが disabled になり status が表示される` (`examples/react-component-poc/tests/counter.test.tsx:66`) | 既覆 (候補) |
| T-UI-011 | (なし) | 未覆 |
| T-UI-012 | `T-UI-007 markup に value + ボタン群が含まれる` (`examples/react-component-poc/tests/counter.test.tsx:79`) | 既覆 (候補) |
| T-UI-013 | `T-UI-007 markup に value + ボタン群が含まれる` (`examples/react-component-poc/tests/counter.test.tsx:79`) | 既覆 (候補) |
| T-UI-014 | (なし) | 未覆 |

`既覆 (候補)` の 9 件は中身を読み、 TC の入力と期待の両方を実際に走らせていることを確認した。

**T-UI-007 (step を指定した加算) は候補なし**。
既存の `T-UI-002` は名前が「step 反映」 だが、 assertion は mount 直後の `value` が `"0"` であることだけで、
**`+` を 1 度も click していない**。 `step` が加算に効いているかは 1 件も確かめていない。
名前で判定していたら `既覆` に倒れ、 `step` の加算経路は永久に覆われなかった。

**T-UI-009 / T-UI-010 は同じ既存 test を候補にする**。
既存 `T-UI-006` が「disabled になり status が表示される」 の 2 つを 1 件で確かめているため。
本 spec は 1 TC = 1 検証単位に分けたので、 2 TC が同じ候補を指す形になる。 中身は両方とも走っているため
どちらも `既覆 (候補)` とした (`T-UI-012` / `T-UI-013` も同じ理由で `T-UI-007` を共有する)。

## 自動化すべきテスト

`未覆` / `不明` を先に置き、 その中で優先度順。

未覆 (5 件)。

1. **T-UI-004 / T-UI-007 (P0)** — 初期値が `max` 以上の時の無効化と、 `step` を指定した加算。
   どちらも prop の組合せでしか通らない経路で、 既定 prop の test では踏まない
2. **T-UI-003 / T-UI-011 (P1)** — `max` 未到達で status が出ないこと、 到達後に `reset` すると
   `+` が再び有効になること。 **無効化の解除側を 1 件も見ていない**
3. **T-UI-014 (P1)** — max 到達時の markup に status が含まれること

既覆 (候補) 9 件。 実装前に候補の中身を読み、 重複なら書かない。

- T-UI-001 / T-UI-002 / T-UI-005 / T-UI-006 / T-UI-008 (P0) — 既存 test が同じ入力と期待を走らせているため書かない
- T-UI-009 / T-UI-010 (P0) — 既存 `T-UI-006` が 2 つまとめて確かめているため書かない
- T-UI-012 / T-UI-013 (P1) — 既存 `T-UI-007` が 4 点まとめて確かめているため書かない

## 手動確認でよいテスト

(なし)

3 mode すべて jsdom 上で決定的に走るため、 手動確認を要する経路が無い。

## 不足している仕様

- **`step` が `max` を跨ぐ場合の挙動が未定義**。 実装は clamp しないため `step=5, max=2` で 1 回
  click すると `count` は `5` になり、 `max` を超えた値が表示される。 「超過を許す」 のか
  「`max` で止める」 のかが読めないため TC を起こしていない
- **`max` より小さい `initial` に対する `reset` の扱いは定義済だが、 `initial > max` の組合せが未定義**。
  実装では最初から `+` が無効なので `reset` は no-op になるが、 それが意図か偶然かが読めない
- **負の `step` の扱いが未定義**。 型は `number` で負値を拒まないため `+` が減算になる
- 本 spec は Layer 2 の追記経路を確かめる dogfood として作成した。 component 側の変更提案は含まず、
  現状の挙動をそのまま記述している
