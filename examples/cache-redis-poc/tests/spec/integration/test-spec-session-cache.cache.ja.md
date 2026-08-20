# test-spec-session-cache (cache layer)

`src/session-cache.ts` が cache の上に組む署名フロー用 session の
保存 / 読出 / 失効 / 期限延長を対象にする。

失効時に Pub/Sub へ通知を出すため、下流の worker が自分の cache を捨てられる。

- module: session-cache
- layer: cache
- provider: redis

## 対象機能

| 関数 | 引数 | 返り値 |
|---|---|---|
| `storeSession(env, id, payload)` | session id と payload | `void` (`ttlSeconds: 900` で保存) |
| `readSession(env, id)` | session id | `SessionPayload` または `null` |
| `invalidateSession(env, id)` | session id | `{ deleted: boolean }` (削除が完了すれば通知を出す) |
| `extendSession(env, id, seconds)` | session id と秒数 | 延長できたかの真偽 |

定数は 2 つ。`SESSION_TTL_SECONDS = 900` と
`SESSION_INVALIDATE_CHANNEL = 'session.invalidated'`。

## 仕様の要約

### key の名前空間

保存先の key は `session:<id>` で、id をそのまま key にしない。
空の cache に保存した場合、生の id は作られず `null` のままである。

### 保存と読出

`storeSession` は毎回 `ttlSeconds: 900` を付けて上書きする。
**同じ id で 2 度保存すると、値も残り時間も置き換わる**。
短くしておいた残り時間は 900 へ戻る。

`readSession` は `null` をそのまま `null` として返し、
それ以外は `JSON.parse` に渡す。**壊れた値は捕まえず `SyntaxError` が伝わる**。

### 失効

`invalidateSession` は `env.delete` が完了した後、削除件数が 0 / 1 のどちらでも
**通知を出す**。`env.delete` 自体が例外を送出した場合は publish へ進まない。

| 削除対象 | `deleted` |
|---|---|
| 生きている session | `true` |
| 存在しない id | `false` |
| 期限切れの session | `false` |

通知の中身は `{ sessionId, at: 'now' }` で、`at` は固定の文字列である
(時刻ではない)。

### 期限延長

`extendSession` は下層の `expire` をそのまま呼ぶ。

| 入力 | 挙動 |
|---|---|
| 生きている session | 残り時間を指定秒へ置き換え `true` |
| 存在しない / 期限切れ | `false` |
| 秒数が 0 以下 | `expire: ttlSeconds must be positive` を送出 |

### 停止後

`env.stop()` の後に読み書きすると
`setupCacheEnv: cannot <op> after stop()` を送出する。

## 主な品質リスク

- **削除件数が 0 でも通知する**。 対象 key が無くても通知は出るため、
  下流が「消えた」 と解釈すると存在しない session の失効を伝播する
- **上書きが残り時間を戻す**。 短縮した残り時間を保ったまま値だけ更新する経路が無い
- **壊れた値を捕まえない**。 cache に別形式の値が入ると呼出側まで例外が届く
- **`at: 'now'` は時刻ではない**。 下流が時刻として解釈すると壊れる

## 推奨テスト構成

`setupCacheEnv()` の既定は in-memory で、実 Redis を起動しない。
期限切れは 1 秒の残り時間で作る。`expiryTickMs` は待機時間より長くし、
対象操作の `get` / `delete` / `expire` 自身に期限切れを判定させる。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 保存と読出 | `storeSession` → `readSession` |
| 2 | 残り時間 | 既定 900、延長、上書きによる戻り |
| 3 | 失効 | 削除の成否と通知 |
| 4 | 期限切れ | 読出が `null`、失効が `false` |
| 5 | 名前空間 | 生の id では引けない |
| 6 | 異常系 | 壊れた値、0 以下の秒数、停止後 |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Provider | Mode |
|---|---|---|---|---|---|---|---|---|
| T-CACHE-POC-001 | 保存した session を読み戻す | 空の cache | `storeSession` → `readSession` | 保存した payload と等しい | P0 | yes | redis | in-memory |
| T-CACHE-POC-002 | 既定の残り時間が付く | 空の cache | `storeSession` | `session:sess-1` の残りが 890〜900 | P0 | yes | redis | in-memory |
| T-CACHE-POC-003 | 失効で key が消え通知が出る | 保存済 session と購読 | `invalidateSession` | `deleted===true`、読出が `null`、通知が `{ sessionId, at: 'now' }` | P0 | yes | redis | in-memory |
| T-CACHE-POC-004 | 存在しない id でも通知は出る | 空の cache と購読 | `invalidateSession('never-existed')` | `deleted===false`、通知に id が載る | P0 | yes | redis | in-memory |
| T-CACHE-POC-005 | 通知を正規表現で捕まえられる | 保存済 session と購読 | `invalidateSession` → `assertPublished` | `/"sessionId":"sess-1"/` に一致 | P1 | yes | redis | in-memory |
| T-CACHE-POC-006 | 残り時間を指定秒へ延ばす | 保存済 session | `extendSession(3600)` | `true`、残りが 3590〜3600 | P0 | yes | redis | in-memory |
| T-CACHE-POC-007 | 無い / 期限切れの session は延ばせない | 空の cache と、残り 1 秒で保存した session | `extendSession('gone', 60)`、1.2 秒待って `extendSession('short', 60)` | 両方 `false` | P1 | yes | redis | in-memory |
| T-CACHE-POC-008 | 期限切れは `null` として読める | 残り 1 秒で保存、掃除間隔 60 秒 | 1.2 秒待って `readSession` | `null` | P0 | yes | redis | in-memory |
| T-CACHE-POC-009 | 生の id では引けない | 保存済 session | `env.get('sess-1')` と `env.get('session:sess-1')` | 前者は `null`、後者は非 `null` | P1 | yes | redis | in-memory |
| T-CACHE-POC-010 | 上書きが値と残り時間を置き換える | 保存後に残りを 60 秒へ縮めた session | 同じ id で `storeSession` | 残りが 890〜900 へ戻り、`role` が新しい値 | P1 | yes | redis | in-memory |
| T-CACHE-POC-011 | 壊れた値は捕まえず伝わる | `session:broken` に `'not json'` を保存 | `readSession('broken')` | `SyntaxError` を送出 | P1 | yes | redis | in-memory |
| T-CACHE-POC-012 | 期限切れの失効は `false` を返して通知する | 残り 1 秒で保存、掃除間隔 60 秒、購読済み | 1.2 秒待って `invalidateSession` | `deleted===false`、通知が `{ sessionId, at: 'now' }` | P1 | yes | redis | in-memory |
| T-CACHE-POC-013 | 0 以下の秒数を拒む | 保存済 session | `extendSession(0)` と `extendSession(-1)` | 両方 `expire: ttlSeconds must be positive` を送出 | P2 | yes | redis | in-memory |
| T-CACHE-POC-014 | 停止後の読出を拒む | `env.stop()` 済 | `readSession` | `cannot get after stop()` を送出 | P2 | yes | redis | in-memory |

## 自動化方針

`setupCacheEnv()` の既定は in-memory で、実 Redis も testcontainers も起動しない。
`afterEach` で `env.stop()` を呼び、env を跨いだ state の持ち越しを断つ。

**期限切れは待って作る。**
掃除の間隔を 60 秒にして残り 1 秒で保存し、1.2 秒待つ。
掃除より先に対象操作を呼ぶことで、`get` / `delete` / `expire` の各経路が
期限切れを判定する。0 以下の `ttlSeconds` は送出される。

T-CACHE-POC-014 は `env.stop()` を明示的に呼ぶため `afterEach` の掃除対象に載せない
(二重に停止すると別の経路に入る)。

## 自動化すべきテスト

- T-CACHE-POC-001 〜 T-CACHE-POC-014 全件自動化推奨
- 実時間を待つ 3 件 (007 / 008 / 012) は残り 1 秒 + 1.2 秒待機で確認する

## 手動確認でよいテスト

- (なし)

## 不足している仕様

- 通知の `at` が固定文字列 `'now'` である。 実時刻を入れるのか、
  そもそも時刻を載せないのかが未定義。 下流が時刻として解釈する前提なら壊れる
- 削除件数が 0 でも通知を出す設計が意図かどうかが未定義。
  下流が「消えた」 と解釈すると、存在しない session の失効を伝播する
- 壊れた値を `readSession` が捕まえない。 呼出側で握るのか、
  `null` へ倒すのか、別形式が入りうる前提かが未定義
- 上書きが残り時間を戻すため、値だけ更新して残りを保つ経路が無い。
  必要かどうかが未定義
