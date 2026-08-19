<!-- kiwa-layers: source=flag layers=api -->

# test-spec-items (api layer)

- module: items
- layer: api
- 対象実装: `examples/nextjs-api-poc/src/route.ts`

## 対象機能

`createItemsHandler()` — `/api/items` の GET と POST を扱う fetch handler。

item は handler 内の配列に保持され、 `id` は 1 起点の連番。
`/api/items` 以外の path は method を問わず 404、 GET / POST 以外の method は 405 を返す。

| 経路 | 応答 |
|---|---|
| `GET /api/items` | 200 + item の配列 |
| `POST /api/items` (正常) | 201 + 作成した item |
| `POST /api/items` (JSON 不正) | 400 + `{ error: 'invalid json' }` |
| `POST /api/items` (name 不正) | 400 + `{ error: 'name required' }` |
| `POST /api/items` (name 101 字以上) | 422 + `{ error: 'name too long' }` |
| その他 method | 405 |
| その他 path | 404 |

## 仕様の要約

### ユーザー操作

- 一覧を取得する (`GET`)
- item を作る (`POST` に `{ name }` を渡す)

### API 契約 (HTTP / RPC)

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/items` | (なし) | `200` + `Item[]` |
| POST | `/api/items` | `{ name: string }` | `201` + `Item` |
| POST | `/api/items` | 不正な JSON | `400` + `{ error }` |
| POST | `/api/items` | `name` が空 / 非文字列 | `400` + `{ error }` |
| POST | `/api/items` | `name` が 101 字以上 | `422` + `{ error }` |
| (その他) | `/api/items` | — | `405` |
| (任意) | それ以外 | — | `404` |

### DB / State 更新

| Table / State | 触れる column | tx 境界 |
|---|---|---|
| handler 内の `items` 配列 | 末尾に追加 | POST 1 回 |
| handler 内の `nextId` | +1 | POST 1 回 (成功時のみ) |

`createItemsHandler()` を呼ぶたびに state は初期化される。 永続化しない。

### 権限モデル

該当なし (認証 / role の概念を持たない)。

### 外部連携

該当なし。 DB / 3rd-party API のいずれにも接続しない。

### 失敗 mode

| 失敗 | 契機 |
|---|---|
| `400 invalid json` | body が JSON として読めない |
| `400 name required` | `name` が無い / 文字列でない / 空文字 |
| `422 name too long` | `name` が 101 字以上 |
| `405` | `/api/items` に GET / POST 以外 |
| `404` | `/api/items` 以外の path |

## 主な品質リスク

| 基準 | スコア | 根拠 1 文 |
|---|---|---|
| 売上影響 | 低 | 例として置いた handler で、 収益経路に乗らない |
| セキュリティ影響 | 中 | 外部入力 (`name`) を検証する分岐を持ち、 緩むと不正な値が state に入る |
| データ破壊リスク | 低 | state は handler 内の配列で、 永続化しない |
| 利用頻度 | 中 | `@kiwa-lab/api` の 3 mode を通す例として毎回使われる |
| 過去障害履歴 | 低 | 該当 handler の bug 報告なし |

**総合リスク = 中**。

入力検証が 4 分岐 (JSON parse / 型 / 空文字 / 長さ) あり、 **どれか 1 つが緩んでも 201 が返る**。
成功側の test だけでは検知できないため、 失敗側を分岐ごとに見る。

## 推奨テスト構成

| 層 | 方針 |
|---|---|
| 統合 (api) | 3 mode すべて。 入力検証は分岐ごとに 1 件 |
| 単体 | 不要 (handler が HTTP の形に閉じている) |
| E2E | 不要 |

## テスト観点一覧

| # | 観点 | 適用理由 |
|---|---|---|
| 1 | 正常系 | 常に |
| 2 | 異常系 | 400 / 405 / 422 / 404 の 4 系統を持つ |
| 3 | 境界値 | `name` の長さ (100 / 101) が分岐する |
| 6 | 入力バリデーション | `name` の有無 / 型 / 空文字を検証する |

`4 状態遷移` は status field を持たないため除外。
`5 権限` は role が無いため該当しない。
`7 冪等性` / `8 並行処理` / `9 性能` / `10 セキュリティ` は § 主な品質リスク のとおり該当しない。
`11 回帰` は既存 test 9 件が存在するが、 過去 bug fix の再発防止を目的とする case が無いため今回は対象外。

## テストケース一覧

### 観点 1 — 正常系

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-001 | GET 空一覧 | items=[] | `GET /api/items` | `200` + `[]` を返す | P0 | yes | live | /api/items |
| T-API-002 | POST 作成 | items=[] | `POST /api/items {name:'first'}` | `201` + `{id:1,name:'first'}` を返す | P0 | yes | live | /api/items |
| T-API-003 | POST の反映 | 2 件 POST 済 | `GET /api/items` | 挿入順で 2 件返す (`id` は 1,2) | P0 | yes | live | /api/items |
| T-API-008 | mock 固定応答 | mock handler 登録済 | `GET /api/items` | mock の固定値を返す | P1 | yes | mock | /api/items |
| T-API-009 | hybrid の既定動作 | `mockHandlers=[]` | `POST` → `GET` | live 実装の結果が返る | P1 | yes | hybrid | /api/items |
| T-API-013 | name 100 字ちょうど | items=[] | `POST {name:'x'.repeat(100)}` | `201` を返す (境界の内側) | P1 | yes | live | /api/items |

### 観点 2 — 異常系

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-005 | name 長過ぎ | items=[] | `POST {name:'x'.repeat(101)}` | `422` を返す | P0 | yes | live | /api/items |
| T-API-006 | 未対応 method | items=[] | `DELETE /api/items` | `405` を返す | P1 | yes | live | /api/items |
| T-API-007 | 未対応 path (GET) | — | `GET /api/other` | `404` を返す | P1 | yes | live | /api/other |
| T-API-014 | 未対応 path (POST) | — | `POST /api/other {name:'x'}` | `404` を返す (path 判定が method 判定より先) | P1 | yes | live | /api/other |

### 観点 6 — 入力バリデーション

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-004 | name 欠落 | items=[] | `POST {}` | `400` + `error='name required'` | P0 | yes | live | /api/items |
| T-API-010 | JSON が壊れている | items=[] | `POST` に生文字列 `'{invalid'` | `400` + `error='invalid json'` | P0 | yes | live | /api/items |
| T-API-011 | name が文字列でない | items=[] | `POST {name:123}` | `400` + `error='name required'` | P1 | yes | live | /api/items |
| T-API-012 | name が空文字 | items=[] | `POST {name:''}` | `400` + `error='name required'` | P1 | yes | live | /api/items |

## 既存 test との対応

`/kiwa-design` § Step 2 § 既存 test の探索 の実測結果と、 § テストケース一覧 の全 TC を突き合わせた結果。

- 探索した runtime — `typescript` (`docs/layers.json` の `api` layer)
- 探索した path — `examples/nextjs-api-poc/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` は除外)。 見つかったのは `tests/` のみ
- 見つけた既存 test — 12 件 (`describe` 3 + `it` 9)

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-API-001 | `T-API-001 GET 正常系: 空配列を返す` (`examples/nextjs-api-poc/test/integration/items.api.test.ts:16`) | 既覆 (候補) |
| T-API-002 | `T-API-002 POST 正常系: 201 + 新規 id 返却` (`examples/nextjs-api-poc/test/integration/items.api.test.ts:24`) | 既覆 (候補) |
| T-API-003 | `T-API-003 POST + GET の整合性` (`examples/nextjs-api-poc/test/integration/items.api.test.ts:32`) | 既覆 (候補) |
| T-API-004 | `T-API-004 body 無し: 400` (`examples/nextjs-api-poc/test/integration/items.api.test.ts:44`) | 既覆 (候補) |
| T-API-005 | `T-API-005 name 長過ぎ: 422` (`examples/nextjs-api-poc/test/integration/items.api.test.ts:52`) | 既覆 (候補) |
| T-API-006 | `T-API-006 DELETE: 405` (`examples/nextjs-api-poc/test/integration/items.api.test.ts:59`) | 既覆 (候補) |
| T-API-007 | `T-API-007 未対応 path: 404` (`examples/nextjs-api-poc/test/integration/items.api.test.ts:66`) | 既覆 (候補) |
| T-API-008 | `T-API-008 mock handler の固定応答が返る` (`examples/nextjs-api-poc/test/integration/items.api.test.ts:75`) | 既覆 (候補) |
| T-API-009 | `T-API-009 live 実装 + mock 経路共存、 上書きなしなら live 動作` (`examples/nextjs-api-poc/test/integration/items.api.test.ts:92`) | 既覆 (候補) |
| T-API-010 | (なし) | 未覆 |
| T-API-011 | (なし) | 未覆 |
| T-API-012 | (なし) | 未覆 |
| T-API-013 | (なし) | 未覆 |
| T-API-014 | (なし) | 未覆 |

`既覆 (候補)` の 9 件は中身を読み、 TC の入力と期待の両方を実際に走らせていることを確認した。

**入力検証の 4 分岐のうち、 既存 test が踏むのは 1 つだけ**。
`T-API-004` は `POST {}` で「`name` が無い」 分岐に入るが、 JSON parse 失敗 / 非文字列 / 空文字の
3 分岐はどれも通らない。 4 分岐が同じ `400` を返すため、 **status だけを見る test では区別できない**。
本 spec は `error` の値まで期待に含めて分岐を分けた。

## 自動化すべきテスト

`未覆` / `不明` を先に置き、 その中で優先度順。

未覆 (5 件)。

1. **T-API-010 (P0)** — JSON parse 失敗の 400。 handler の `try` / `catch` を通る唯一の経路で、
   既存 test は 1 件も通っていない
2. **T-API-011 / T-API-012 (P1)** — `name` が非文字列 / 空文字。 どちらも `400 name required` を返すが、
   既存 test が踏むのは「`name` が無い」 分岐だけ
3. **T-API-013 (P1)** — `name` 100 字ちょうど。 既存 test は 101 字 (境界の外側) しか見ていない
4. **T-API-014 (P1)** — 未対応 path への POST。 path 判定が method 判定より先に来ることを固定する

既覆 (候補) 9 件。 実装前に候補の中身を読み、 重複なら書かない。

- T-API-001 / 002 / 003 / 004 / 005 (P0) — 既存 test が同じ入力と期待を走らせているため書かない
- T-API-006 / 007 / 008 / 009 (P1) — 同上

## 手動確認でよいテスト

(なし)

3 mode すべて node 上で決定的に走るため、 手動確認を要する経路が無い。

## 不足している仕様

- **`name` の前後空白の扱いが未定義**。 `'   '` (空白のみ) は `length > 0` を満たすため 201 が返る。
  trim してから検証するのか、 そのまま受けるのかが読めないため TC を起こしていない
- **`id` の払い出しが失敗時に進むかが未定義**。 実装では `nextId++` が成功時のみ動くが、
  それが意図か偶然かが doc から読めない
- **`name` 以外の field を渡した時の扱いが未定義**。 実装は無視して捨てるが、 400 にすべきかが読めない
- **`/api/items` 以外への POST が 404 になる順序が仕様として書かれていない**。 実装では path 判定が
  先に来るため 405 ではなく 404 になる。 本 spec は現状の挙動を T-API-014 として固定するが、
  意図した順序かは確認が要る
- 本 spec は Layer 2 の追記経路を確かめる dogfood として作成した。 handler 側の変更提案は含まず、
  現状の挙動をそのまま記述している
