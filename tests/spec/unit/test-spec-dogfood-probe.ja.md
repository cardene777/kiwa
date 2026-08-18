<!-- kiwa-layers: source=all layers=unit -->

# test-spec-dogfood-probe

- module: dogfood-probe
- layer: unit
- 対象実装: `packages/skill-test/src/index.ts`

## 対象機能

`@kiwa-lab/skill-test` が公開する 4 つの assertion primitive。

skill / agent 実装が呼んだ tool を `ToolSpy` が記録し、 その記録に対して「呼ばれたか」
「呼ばれていないか」 「どの引数で呼ばれたか」 「どの順序で呼ばれたか」 を検証する。

| primitive | 1 文要約 |
|---|---|
| `assertToolCalled(spy, name, opts?)` | 指定 tool が最低 1 回、 `opts.times` 指定時はその回数ちょうど呼ばれたことを要求する |
| `assertToolNotCalled(spy, name)` | 指定 tool が一度も呼ばれていないことを要求する |
| `assertToolCalledWith(spy, name, args)` | 指定 tool の呼出のうち **1 回でも** 引数が deep 一致することを要求する |
| `assertToolCallOrder(spy, names)` | 列挙した tool 名が記録順に **subsequence として** 現れることを要求する |

いずれも成功時は `undefined` を返し、 失敗時は `Error` を throw する。 vitest の `expect` と
同じ contract で、 test body から自然に fail する。

## 仕様の要約

### ユーザー操作

test 作者が `createToolSpy()` で spy を作り、 対象実装の tool 呼出 interceptor に注入する。
実装を走らせた後、 4 primitive を任意に組合せて assertion する。

### API 契約

| 項目 | 内容 |
|---|---|
| `ToolCallRecord` | `{ name: string; arguments: string; order: number }` |
| `order` | spy 内 counter による 0 起点の単調増加。 `Date.now()` を使わない (同 ms 内の複数呼出で順序が壊れるため) |
| `arguments` | JSON string。 OpenAI 形式の `tool_calls[].function.arguments` に整合 |
| 引数比較 | `JSON.parse` 後に自前の `deepEquals` で比較。 parse 失敗時は raw string として扱う |
| 順序比較 | subsequence 一致。 間に他 tool が挟まることを許す |

### 権限モデル

該当なし (純粋関数群、 外部 state を持たない)。

### 外部連携

該当なし。 network / filesystem / 時刻のいずれにも依存しない。

### 失敗 mode

| 失敗 | 契機 |
|---|---|
| `assertToolCalled` throw | 未呼出、 または `times` 指定時の回数不一致 |
| `assertToolNotCalled` throw | 1 回以上呼ばれている |
| `assertToolCalledWith` throw | 未呼出、 または全呼出で引数不一致 |
| `assertToolCallOrder` throw | 列挙順が subsequence として現れない |

## 主な品質リスク

| 基準 | スコア | 根拠 1 文 |
|---|---|---|
| 売上影響 | 低 | test 補助 library で、 production の収益経路に乗らない |
| セキュリティ影響 | 低 | 外部入力を実行せず、 network / filesystem に触れない |
| データ破壊リスク | 低 | 状態は spy 内の配列のみで、 永続化しない |
| 利用頻度 | 中 | skill 系 package の behavior test から呼ばれるが、 全 package ではない |
| 過去障害履歴 | 低 | 該当 primitive の bug 報告なし |

**総合リスク = 低**。

ただし **本 module は「test が正しいこと」 を保証する側**にある。 ここが誤って pass すると、
それを使う全 test が静かに緩む。 総合リスクは低いが、 誤って **pass する** 方向の失敗
(false negative) は他 module より重い。 テストケースはその向きに厚くする。

## 推奨テスト構成

| 層 | 方針 |
|---|---|
| 単体 | 4 primitive すべて。 pass 経路と throw 経路を対で置く |
| 統合 | 不要 (依存が無い) |
| E2E | 不要 |

`@kiwa-lab/skill-test` 自身を使って自身を test すると、 検査対象と検査手段が同一になり
「両方が同じ向きに壊れた」 場合に検知できない。 本 spec の test は vitest の `expect` で
throw / no-throw を直接見る。

## テスト観点一覧

| # | 観点 | 適用理由 |
|---|---|---|
| 1 | 正常系 | 常に |
| 2 | 異常系 | throw 契約を持つため必須 |
| 3 | 境界値 | `times: 0` / 空配列 / 呼出 0 件の各境界 |
| 6 | 入力バリデーション | `arguments` が JSON でない場合の fallback 経路 |

`4 状態遷移` は state machine を持たないため除外。 `5 権限` / `7 冪等性` / `8 並行処理` /
`9 性能` / `10 セキュリティ` は § 主な品質リスク のとおり該当しない。 `11 回帰` は既知不具合の
再発防止を目的とする case が無いため今回は対象外。

## テストケース一覧

### 観点 1 — 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | 単体 | 正常系 | spy に `Read` を 1 回記録 | `'Read'` | `assertToolCalled(spy, 'Read')` | throw しない | 高 | 推奨 |
| TC-002 | 単体 | 正常系 | spy に `Read` を 2 回記録 | `'Read', { times: 2 }` | `assertToolCalled(spy, 'Read', { times: 2 })` | throw しない | 高 | 推奨 |
| TC-003 | 単体 | 正常系 | spy に `Read` のみ記録 | `'Bash'` | `assertToolNotCalled(spy, 'Bash')` | throw しない | 高 | 推奨 |
| TC-004 | 単体 | 正常系 | spy に `Read` を `{"path":"a"}` で記録 | `'Read', { path: 'a' }` | `assertToolCalledWith(spy, 'Read', { path: 'a' })` | throw しない | 高 | 推奨 |
| TC-005 | 単体 | 正常系 | spy に `Read` → `Bash` の順で記録 | `['Read', 'Bash']` | `assertToolCallOrder(spy, ['Read', 'Bash'])` | throw しない | 高 | 推奨 |
| TC-006 | 単体 | 正常系 | spy に `Read` → `Grep` → `Bash` を記録 | `['Read', 'Bash']` | `assertToolCallOrder(spy, ['Read', 'Bash'])` | throw しない (間に `Grep` が挟まっても subsequence として一致) | 高 | 推奨 |
| TC-007 | 単体 | 正常系 | spy に `Read` を 2 回、 2 回目のみ `{"path":"b"}` | `'Read', { path: 'b' }` | `assertToolCalledWith(spy, 'Read', { path: 'b' })` | throw しない (1 回でも一致すれば pass) | 高 | 推奨 |

### 観点 2 — 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-008 | 単体 | 異常系 | spy が空 | `'Read'` | `assertToolCalled(spy, 'Read')` | throw する。 message に `never invoked` を含む | 高 | 推奨 |
| TC-009 | 単体 | 異常系 | spy に `Read` を 1 回記録 | `'Read', { times: 2 }` | `assertToolCalled(spy, 'Read', { times: 2 })` | throw する。 message に期待 2 と実測 1 の両方を含む | 高 | 推奨 |
| TC-010 | 単体 | 異常系 | spy に `Bash` を 1 回記録 | `'Bash'` | `assertToolNotCalled(spy, 'Bash')` | throw する。 message に呼出回数 1 を含む | 高 | 推奨 |
| TC-011 | 単体 | 異常系 | spy が空 | `'Read', { path: 'a' }` | `assertToolCalledWith(spy, 'Read', { path: 'a' })` | throw する。 message に `never called` を含む | 高 | 推奨 |
| TC-012 | 単体 | 異常系 | spy に `Read` を `{"path":"a"}` で記録 | `'Read', { path: 'z' }` | `assertToolCalledWith(spy, 'Read', { path: 'z' })` | throw する。 message に観測した引数を含む | 高 | 推奨 |
| TC-013 | 単体 | 異常系 | spy に `Bash` → `Read` の順で記録 | `['Read', 'Bash']` | `assertToolCallOrder(spy, ['Read', 'Bash'])` | throw する。 message に `matched up to index` を含む | 高 | 推奨 |

### 観点 3 — 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-014 | 単体 | 境界値 | spy が空 | `'Read', { times: 0 }` | `assertToolCalled(spy, 'Read', { times: 0 })` | throw しない (0 回ちょうど) | 中 | 推奨 |
| TC-015 | 単体 | 境界値 | spy に `Read` を 1 回記録 | `'Read', { times: 0 }` | `assertToolCalled(spy, 'Read', { times: 0 })` | throw する | 中 | 推奨 |
| TC-016 | 単体 | 境界値 | spy が空 | `[]` | `assertToolCallOrder(spy, [])` | throw しない (§ 不足している仕様 に契約未定義として記録) | 中 | 推奨 |
| TC-017 | 単体 | 境界値 | spy に `Read` を 1 回記録 | `[]` | `assertToolCallOrder(spy, [])` | throw しない (同上) | 中 | 推奨 |
| TC-018 | 単体 | 境界値 | spy に `Read` を 1 回記録し `reset()` | `'Read'` | `reset()` 後に `assertToolCalled(spy, 'Read')` | throw する (記録が消えている) | 中 | 推奨 |
| TC-019 | 単体 | 境界値 | spy に `Read` を 3 回記録 | — | `spy.getCalls()` の `order` | `[0, 1, 2]` で単調増加する | 中 | 推奨 |

### 観点 6 — 入力バリデーション

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-020 | 単体 | 入力バリデーション | spy に `Bash` を `--verbose` (JSON でない) で記録 | `'Bash', '--verbose'` | `assertToolCalledWith(spy, 'Bash', '--verbose')` | throw しない (parse 失敗時は raw string として比較) | 中 | 推奨 |
| TC-021 | 単体 | 入力バリデーション | spy に `Read` を `{"a":{"b":1}}` で記録 | `'Read', { a: { b: 1 } }` | `assertToolCalledWith(spy, 'Read', { a: { b: 1 } })` | throw しない (入れ子 object を deep 比較) | 中 | 推奨 |
| TC-022 | 単体 | 入力バリデーション | spy に `Read` を `{"a":1}` で記録 | `'Read', { a: 1, b: 2 }` | `assertToolCalledWith(spy, 'Read', { a: 1, b: 2 })` | throw する (key 数が異なる) | 中 | 推奨 |
| TC-023 | 単体 | 入力バリデーション | spy に `Read` を `{"a":null}` で記録 | `'Read', { a: {} }` | `assertToolCalledWith(spy, 'Read', { a: {} })` | throw する。 **`Object.keys(null)` の TypeError ではなく assertion 失敗**として返る | 中 | 推奨 |

## 既存 test との対応

`/kiwa-design` § Step 2 § 既存 test の探索 の実測結果と、 § テストケース一覧 の全 TC を突き合わせた結果。

- 探索した path — `packages/skill-test/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` 除外)。 見つかった dir は `tests/` のみで `test/` は存在しない
- 見つけた既存 test — 27 件 (`tests/skill-test.test.ts` 26 件 + `tests/docs-library-skill-test.test.ts` 1 件)
- 判定の履歴 — 探索を持たなかった初回 dogfood では、 既存 19 件を 1 件も見ずに 23 TC を起こし 18 件が重複した。 探索を入れた再 dogfood で候補なし 5 件 (TC-014 / 015 / 021 / 022 / 023) を検出し、 候補ありの 18 件も body を読んだ結果 2 件 (TC-017 / TC-018) が「名前は一致するが入力を走らせていない」 と判明した。 計 7 件を既存 file へ追記した後の状態が下表

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| TC-001 | `少なくとも 1 回呼ばれていれば pass` (`tests/skill-test.test.ts:52`) | 既覆 (候補) |
| TC-002 | `times 指定で回数厳密一致` (`tests/skill-test.test.ts:64`) | 既覆 (候補) |
| TC-003 | `未呼出で pass` (`tests/skill-test.test.ts:74`) | 既覆 (候補) |
| TC-004 | `引数一致 (deep equal) で pass` (`tests/skill-test.test.ts:88`) | 既覆 (候補) |
| TC-005 | `subsequence として一致すれば pass` (`tests/skill-test.test.ts:129`) | 既覆 (候補) |
| TC-006 | `間に他 tool 挟んでも subsequence 一致で pass` (`tests/skill-test.test.ts:137`) | 既覆 (候補) |
| TC-007 | `複数呼出のうち 1 つでも一致すれば pass` (`tests/skill-test.test.ts:104`) | 既覆 (候補) |
| TC-008 | `未呼出で throw` (`tests/skill-test.test.ts:58`) | 既覆 (候補) |
| TC-009 | `times 指定で回数厳密一致` (`tests/skill-test.test.ts:64`) | 既覆 (候補) |
| TC-010 | `1 回でも呼ばれてたら throw` (`tests/skill-test.test.ts:80`) | 既覆 (候補) |
| TC-011 | `tool 未呼出で throw` (`tests/skill-test.test.ts:112`) | 既覆 (候補) |
| TC-012 | `引数不一致で throw` (`tests/skill-test.test.ts:96`) | 既覆 (候補) |
| TC-013 | `順序逆で throw` (`tests/skill-test.test.ts:147`) | 既覆 (候補) |
| TC-014 | `TC-014 未呼出で times: 0 なら pass` (`tests/skill-test.test.ts:181`) | 既覆 (候補) |
| TC-015 | `TC-015 1 回呼ばれていて times: 0 なら throw` (`tests/skill-test.test.ts:186`) | 既覆 (候補) |
| TC-016 | `TC-016 spy が空で expectedOrder も空なら pass` (`tests/skill-test.test.ts:165`) | 既覆 (候補) |
| TC-017 | `TC-017 呼出記録があっても expectedOrder が空なら pass` (`tests/skill-test.test.ts:170`) | 既覆 (候補) |
| TC-018 | `TC-018 reset 後は assertToolCalled が throw する` (`tests/skill-test.test.ts:230`) | 既覆 (候補) |
| TC-019 | `record + getCalls で挿入順を保持する` (`tests/skill-test.test.ts:11`) | 既覆 (候補) |
| TC-020 | `non-JSON 引数 (CLI style) は raw string 比較 fallback` (`tests/skill-test.test.ts:119`) | 既覆 (候補) |
| TC-021 | `TC-021 入れ子 object を deep 比較して pass` (`tests/skill-test.test.ts:196`) | 既覆 (候補) |
| TC-022 | `TC-022 key 数が異なれば throw` (`tests/skill-test.test.ts:202`) | 既覆 (候補) |
| TC-023 | `TC-023 null と object の比較を TypeError ではなく assertion 失敗にする` (`tests/skill-test.test.ts:210`) | 既覆 (候補) |

`既覆 (候補)` は「候補の test が見つかった」 までの判定で、 覆われていることの断定ではない。
本表の 23 件は候補の body を 1 件ずつ読み、 TC の入力と期待を実際に走らせていることを確認済。

## 自動化すべきテスト

`未覆` / `不明` を先に置き、 その中で優先度順。

未覆 / 不明。

- (なし) — § 既存 test との対応 のとおり 23 件とも既存 test が覆っている。 本 spec から新規に書くべき TC は無い

既覆 (候補)。 実装前に候補の body を読み、 重複なら書かない。

1. **TC-001 〜 TC-013 (高)** — 4 primitive の pass 経路と throw 経路。 本 module の契約そのもの
   で、 どちらか一方だけでは「常に pass する assertion」 を検知できない
2. **TC-014 〜 TC-019 (中)** — 境界値。 特に TC-014 / TC-015 の `times: 0` は「0 回であること」
   を要求する唯一の経路で、 `assertToolNotCalled` と意味が重なるため両者の一致を確かめる価値がある
3. **TC-020 〜 TC-023 (中)** — 引数比較の分岐。 `safeParse` の fallback と `deepEquals` の
   `null` 経路は、 それぞれ 1 本の分岐で守られており test が無いと落ちても気付けない

全 23 件が自動化対象。 外部依存が無く決定的に走るため、 手動確認に回す理由が無い。

## 手動確認でよいテスト

(なし)

外部依存 / 時刻 / network のいずれにも触れないため、 手動確認を要する経路が存在しない。

## 不足している仕様

- **`assertToolCallOrder` に空配列を渡した時の契約が未定義** (TC-016 / TC-017)。 実装を読むと
  throw しないが、 これが意図なのか偶然なのかが doc からは読めない。 「空配列は常に pass」 と
  明記するか、 引数として拒否するかを決める必要がある
- **`assertToolCalled` の `times: 0` と `assertToolNotCalled` の関係が未定義** (TC-014 / TC-015)。
  両者は同じ条件を表すが、 doc は前者を「回数と厳密一致」、 後者を「一度も呼ばれていない」 と
  別々に説明している。 等価であることを明記すべきか、 片方を推奨とするか
- **`deepEquals` が配列を object として比較する**。 `Object.keys` で index を key として扱うため
  `[1,2]` と `{0:1,1:2}` が一致し得る。 意図的な単純化か、 修正すべき欠陥かが doc から読めない
  (本 spec では TC を起こしていない。 判断が付いてから追加する)
- **TC-023 は初版が到達不能だった**。 当初は `{a:null}` 同士を比較して「throw しない」 を
  期待したが、 `deepEquals` 先頭の `a === b` が `null === null` を true で返すため
  `a === null || b === null` の行に届かない。 実際に変異試験でその行を削除しても pass した。
  片側だけ `null` にする形 (`{a:null}` vs `{a:{}}`) に直して、 削除すると FAIL することを確認済。
  **spec を書いた時点では「その行を通る入力」 を確かめていなかった**
- 本 spec は dogfood 目的の probe として作成した。 実装への変更提案は含めず、 現状の契約を
  そのまま記述している
