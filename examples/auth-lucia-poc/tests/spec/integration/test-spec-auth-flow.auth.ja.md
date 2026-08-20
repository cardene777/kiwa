# test-spec-auth-flow (auth layer)

`src/route.ts` の保護 route と、`@kiwa-lab/auth` の `setupLuciaEnv` が組む
sign up / sign in / session 検証 / rolling expiry 更新 / logout の経路を対象にする。

Lucia は framework を選ばないため、PoC は Web 標準の `Request` / `Response` だけで組む。
HTTP server を起動せずに全経路を通せる。

- module: auth-flow
- layer: auth
- provider: lucia

## 対象機能

`createProtectedRoute(env)` が返す handler が、session id をどこから取り、
何を返すか。

| 関数 | 引数 | 返り値 |
|---|---|---|
| `createProtectedRoute(env)` | `LuciaTestEnv` | `(req: Request) => Promise<Response>` |
| `env.signUpWithPassword({ email, password })` | 新規 user | `{ user, session }` |
| `env.signInWithPassword({ email, password })` | 既存 user | `{ user, session }`、失敗は送出 |
| `env.signInWithOAuth(provider, { sub, email })` | provider の profile | `{ user, session }` |
| `env.invalidateSession(id)` | session id | `void` |

## 仕様の要約

### session id をどこから取るか

```
sessionId = req.headers.get('x-session-id') ?? url.searchParams.get('session') ?? ''
```

**`??` は `null` でしか次へ進まない。**
header が存在して中身が空の場合、値は `''` になるため query の値は読まれない。
header が無い場合だけ query へ落ちる。

これは現行 PoC の観測結果であり、URL で session id を運ぶ方式を本番仕様として承認する
ものではない。URL は access log や referer に残り得るため、本番では query 経路を無効にして
cookie または header に限定する。両経路を残す間は、空を含め header が明示された場合に query
へ fallback させず 401 にする現在の優先順位を fail-closed の挙動として維持する。

### session 検証の 5 分岐 (`validateSessionId`)

| 状態 | 返り値 | 副作用 |
|---|---|---|
| session が無い | `null` | なし |
| 期限切れ (`expiresAt <= now`) | `null` | その session 行を削除する |
| user が消えている | `null` | その session 行を削除する |
| 残りが寿命の半分**未満** | `{ user, session }`、`fresh: true` | `expiresAt` を延長する |
| それ以外 | `{ user, session }`、`fresh: false` | なし |

境界は `remaining < totalMs / 2` の狭義の不等号で、
ちょうど半分なら延長しない。

### 応答

| 条件 | status | body | header |
|---|---|---|---|
| session id が空 | 401 | `{ error: 'missing session' }` | — |
| 検証が `null` | 401 | `{ error: 'invalid session' }` | — |
| 検証が通り `fresh` が真 | 200 | `{ userId, email }` | `x-session-rotated: <同じ id>` |
| 検証が通り `fresh` が偽 | 200 | `{ userId, email }` | 更新通知 header は付かない |

`x-session-rotated` という header 名だが、実装が行うのは同じ session id の
`expiresAt` 延長であり、session id の rotation ではない。この挙動だけでは session fixation
対策にならない。

### 引数の検証 (`setupLuciaEnv`)

| 入力 | 挙動 |
|---|---|
| `providers: []` | `providers must contain at least one entry` を送出 |
| `sessionExpiration <= 0` | `sessionExpiration must be a positive number of seconds` を送出 |

## 主な品質リスク

- **session id の取り出しが 2 経路ある**。 空 header が query の値を隠す形は、
  header を必ず付ける client では表面化せず、付けない client でだけ壊れる
- **期限切れの副作用**。 検証が `null` を返すだけでなく行を消すため、
  「消えたこと」 を確かめないと削除漏れに気付けない
- **rolling expiry 更新の境界**。 狭義の不等号なので、ちょうど半分の時に延長すると仕様が変わる
- **OAuth profile の信頼境界**。 PoC の provider mock は email の検証済み状態を表現せず、
  同じ email の password user へ自動で account を link する。本番で未検証 email を信頼すると
  account takeover につながる

## 推奨テスト構成

`setupLuciaEnv()` で in-memory の adapter を組み、HTTP server を起動しない。
時刻は `env.database.updateSession` で `expiresAt` を直接動かして作る
(実時間を待たない)。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | sign up と保護 route の疎通 | `signUpWithPassword` → 200 |
| 2 | session id の取り出し | header / query / 空 header |
| 3 | 検証の失敗 | 未知 id / 期限切れ / user 欠落 / 失効 |
| 4 | rolling expiry 更新 | `fresh` の真偽と更新通知 header |
| 5 | OAuth | provider 別の sign in と既存 user の再利用 |
| 6 | adapter の互換 | `postgresql` でも同じ形 |
| 7 | 引数の検証 | `providers` / `sessionExpiration` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Provider | Flow |
|---|---|---|---|---|---|---|---|---|
| T-LUCIA-001 | sign up 後に profile を返す | 新規 user | `x-session-id` を付けて保護 route を呼ぶ | `status===200`、`email` が sign up した値 | P0 | yes | lucia | password |
| T-LUCIA-002 | session id が無い | session を持たない | header も query も付けずに呼ぶ | `status===401`、`error==='missing session'` | P0 | yes | lucia | password |
| T-LUCIA-003 | 誤 password と未知 email のエラー文面を揃える | 既存 user | 誤 password と未知 email で `signInWithPassword` | 両方が同じ `invalid email or password` を送出 | P0 | yes | lucia | password |
| T-LUCIA-004 | google sign-in が user と session を作る | user 無し | `signInWithOAuth('google', ...)` → 保護 route | `status===200`、`email` が profile の値 | P0 | yes | lucia | google |
| T-LUCIA-005 | trusted mock profile の同じ email user を再利用する | password で登録済 | `signInWithOAuth('github', 同 email)` | `user.id` が password 側と一致。本番の自動 link を承認するテストではない | P0 | yes | lucia | github |
| T-LUCIA-006 | 更新窓に入ると有効期限の更新を通知する | 残りが寿命の半分未満 | `x-session-id` を付けて呼ぶ | `status===200`、`x-session-rotated` が同じ id を返す | P0 | yes | lucia | password |
| T-LUCIA-007 | 失効させた session は次の要求で通らない | 200 を確認済の session | `invalidateSession` 後に再度呼ぶ | `status===401` | P0 | yes | lucia | password |
| T-LUCIA-008 | postgresql adapter でも同じ形 | `database.kind==='postgresql'` | `signInWithOAuth('google', ...)` → 保護 route | `database.kind==='postgresql'`、`status===200` | P1 | yes | lucia | google |
| T-LUCIA-009 | header が無ければ query から取る | 発行済 session | `?session=<id>` だけを付けて呼ぶ | `status===200`、`email` が sign up した値 | P1 | yes | lucia | password |
| T-LUCIA-010 | 空 header は query の値を fail-closed で隠す | 発行済 session | `x-session-id: ''` と `?session=<id>` を両方付けて呼ぶ | `status===401`、`error==='missing session'` | P1 | yes | lucia | password |
| T-LUCIA-011 | 未知の session id | session を発行していない | `x-session-id: 'nope'` で呼ぶ | `status===401`、`error==='invalid session'` | P1 | yes | lucia | password |
| T-LUCIA-012 | 期限切れは行ごと消える | `expiresAt` を過去に倒した session | `x-session-id` を付けて呼ぶ | `status===401`、`error==='invalid session'`、`getSession(id)` が `null` | P1 | yes | lucia | password |
| T-LUCIA-013 | 発行直後は有効期限を更新しない | 発行直後の session | `x-session-id` を付けて呼ぶ | `status===200`、`x-session-rotated` が付かない | P1 | yes | lucia | password |
| T-LUCIA-014 | 更新境界はちょうど半分を含まない | 固定時刻で残りを寿命のちょうど半分にする | `x-session-id` を付けて呼ぶ | `status===200`、`x-session-rotated` が付かない | P2 | yes | lucia | password |
| T-LUCIA-015 | provider が空なら組み立てを拒む | — | `setupLuciaEnv({ providers: [] })` | `providers must contain at least one entry` を送出 | P2 | yes | lucia | password |
| T-LUCIA-016 | 寿命が正でなければ組み立てを拒む | — | `setupLuciaEnv({ sessionExpiration: 0 })` | `sessionExpiration must be a positive number of seconds` を送出 | P2 | yes | lucia | password |
| T-LUCIA-017 | user が無い session は行ごと消える | session の `userId` を存在しない値へ変える | `x-session-id` を付けて呼ぶ | `status===401`、`error==='invalid session'`、`getSession(id)` が `null` | P1 | yes | lucia | password |
| T-LUCIA-018 | query の未知 session id を拒む | session を発行していない | `?session=nope` で呼ぶ | `status===401`、`error==='invalid session'` | P1 | yes | lucia | password |

## 自動化方針

`setupLuciaEnv()` が返す env は in-memory の adapter を持ち、HTTP server を起動しない。
`afterEach` で `env.stop()` を呼び、env を跨いだ state の持ち越しを断つ。

**時刻は待たずに作る。**
更新窓と期限切れは `env.database.updateSession({ id, expiresAt })` で
`expiresAt` を直接動かす。厳密な境界を扱う T-LUCIA-014 は fake timer で `Date.now()` も固定する。
実時間を待つと寿命の既定 (30 日) を跨げず、境界値も処理時間でずれる。

T-LUCIA-012 は status だけでなく `getSession(id)` が `null` を返すことも確かめる。
削除は検証の副作用なので、status だけでは削除漏れと区別が付かない。

## 自動化すべきテスト

- T-LUCIA-001 〜 T-LUCIA-018 全件自動化推奨
- 時刻を動かす 3 件 (006 / 012 / 014) は `updateSession` で `expiresAt` を直接操作する

## 手動確認でよいテスト

- (なし)

## 不足している仕様

- query から取る経路 (`?session=`) が本番でも使われる想定なのかが未定義。
  session id が URL に載ると referer や access log に残るため、
  本番では無効にする。PoC から削除する時期は未定義
- `signInWithPassword` の失敗文面は揃っているが、未知 email の経路は password KDF を
  実行しないため timing による user enumeration は防いでいない。一定時間化または dummy hash
  検証を本番要件にするかが未定義
- sign in は新しい session id を発行する一方で既存 session を残し、rolling expiry 更新では
  id を変えない。同時 login を許すか、login 時や権限変更時に既存 session を失効させるか、
  session fixation 対策としていつ id を rotation するかが未定義
- provider mock は `emailVerified` を持たず、同じ email の既存 user へ自動 link する。
  本番では provider profile の issuer / subject / verified email を検証し、既存 account の link に
  再認証または明示的な同意を要求する必要がある
- `signUpWithPassword` に既存 email を渡した時の公開エラー方針は未定義
  (現在は adapter の `createUser` に委ねている)
