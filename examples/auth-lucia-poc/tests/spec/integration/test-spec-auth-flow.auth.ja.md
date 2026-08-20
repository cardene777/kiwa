# test-spec-auth-flow (auth layer)

`src/route.ts` の保護 route と、`@kiwa-lab/auth` の `setupLuciaEnv` が組む
sign up / sign in / session 検証 / session 回転 / logout の経路を対象にする。

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

### session 検証の 3 分岐 (`validateSessionId`)

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
| 検証が通り `fresh` が真 | 200 | `{ userId, email }` | `x-session-rotated: <id>` |
| 検証が通り `fresh` が偽 | 200 | `{ userId, email }` | 回転 header は付かない |

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
- **回転の境界**。 狭義の不等号なので、ちょうど半分の時に延長すると仕様が変わる

## 推奨テスト構成

`setupLuciaEnv()` で in-memory の adapter を組み、HTTP server を起動しない。
時刻は `env.database.updateSession` で `expiresAt` を直接動かして作る
(実時間を待たない)。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | sign up と保護 route の疎通 | `signUpWithPassword` → 200 |
| 2 | session id の取り出し | header / query / 空 header |
| 3 | 検証の失敗 | 未知 id / 期限切れ / 失効 |
| 4 | session の回転 | `fresh` の真偽と header |
| 5 | OAuth | provider 別の sign in と既存 user の再利用 |
| 6 | adapter の互換 | `postgresql` でも同じ形 |
| 7 | 引数の検証 | `providers` / `sessionExpiration` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Provider | Flow |
|---|---|---|---|---|---|---|---|---|
| T-LUCIA-001 | sign up 後に profile を返す | 新規 user | `x-session-id` を付けて保護 route を呼ぶ | `status===200`、`email` が sign up した値 | P0 | yes | lucia | password |
| T-LUCIA-002 | session id が無い | session を持たない | header も query も付けずに呼ぶ | `status===401`、`error==='missing session'` | P0 | yes | lucia | password |
| T-LUCIA-003 | 誤った password は user の有無を漏らさない | 既存 user | 誤った password で `signInWithPassword` | `invalid email or password` を送出 | P0 | yes | lucia | password |
| T-LUCIA-004 | google sign-in が user と session を作る | user 無し | `signInWithOAuth('google', ...)` → 保護 route | `status===200`、`email` が profile の値 | P0 | yes | lucia | google |
| T-LUCIA-005 | 同じ email の password user を再利用する | password で登録済 | `signInWithOAuth('github', 同 email)` | `user.id` が password 側と一致 | P0 | yes | lucia | github |
| T-LUCIA-006 | 更新窓に入ると session を回転する | 残りが寿命の半分未満 | `x-session-id` を付けて呼ぶ | `status===200`、`x-session-rotated` が付く | P0 | yes | lucia | password |
| T-LUCIA-007 | 失効させた session は次の要求で通らない | 200 を確認済の session | `invalidateSession` 後に再度呼ぶ | `status===401` | P0 | yes | lucia | password |
| T-LUCIA-008 | postgresql adapter でも同じ形 | `database.kind==='postgresql'` | `signInWithOAuth('google', ...)` → 保護 route | `database.kind==='postgresql'`、`status===200` | P1 | yes | lucia | google |
| T-LUCIA-009 | header が無ければ query から取る | 発行済 session | `?session=<id>` だけを付けて呼ぶ | `status===200`、`email` が sign up した値 | P1 | yes | lucia | password |
| T-LUCIA-010 | 空 header は query の値を隠す | 発行済 session | `x-session-id: ''` と `?session=<id>` を両方付けて呼ぶ | `status===401`、`error==='missing session'` | P1 | yes | lucia | password |
| T-LUCIA-011 | 未知の session id | session を発行していない | `x-session-id: 'nope'` で呼ぶ | `status===401`、`error==='invalid session'` | P1 | yes | lucia | password |
| T-LUCIA-012 | 期限切れは行ごと消える | `expiresAt` を過去に倒した session | `x-session-id` を付けて呼ぶ | `status===401`、`error==='invalid session'`、`getSession(id)` が `null` | P1 | yes | lucia | password |
| T-LUCIA-013 | 発行直後は回転しない | 発行直後の session | `x-session-id` を付けて呼ぶ | `status===200`、`x-session-rotated` が付かない | P1 | yes | lucia | password |
| T-LUCIA-014 | 回転の境界はちょうど半分を含まない | 残りが寿命のちょうど半分 | `x-session-id` を付けて呼ぶ | `status===200`、`x-session-rotated` が付かない | P2 | yes | lucia | password |
| T-LUCIA-015 | provider が空なら組み立てを拒む | — | `setupLuciaEnv({ providers: [] })` | `providers must contain at least one entry` を送出 | P2 | yes | lucia | password |
| T-LUCIA-016 | 寿命が正でなければ組み立てを拒む | — | `setupLuciaEnv({ sessionExpiration: 0 })` | `sessionExpiration must be a positive number of seconds` を送出 | P2 | yes | lucia | password |

## 自動化方針

`setupLuciaEnv()` が返す env は in-memory の adapter を持ち、HTTP server を起動しない。
`afterEach` で `env.stop()` を呼び、env を跨いだ state の持ち越しを断つ。

**時刻は待たずに作る。**
更新窓と期限切れは `env.database.updateSession({ id, expiresAt })` で
`expiresAt` を直接動かす。実時間を待つと寿命の既定 (30 日) を跨げない。

T-LUCIA-012 は status だけでなく `getSession(id)` が `null` を返すことも確かめる。
削除は検証の副作用なので、status だけでは削除漏れと区別が付かない。

## 自動化すべきテスト

- T-LUCIA-001 〜 T-LUCIA-016 全件自動化推奨
- 時刻を動かす 3 件 (006 / 012 / 014) は `updateSession` で `expiresAt` を直接操作する

## 手動確認でよいテスト

- (なし)

## 不足している仕様

- query から取る経路 (`?session=`) が本番でも使われる想定なのかが未定義。
  session id が URL に載ると referer や access log に残るため、
  PoC の便宜なのか意図した経路なのかで扱いが変わる
- `x-session-id` に空文字を渡した時に query へ落ちない挙動が、意図か副作用かが未定義。
  `??` を `||` にすれば落ちるが、どちらが正しいかは決まっていない
- `signInWithPassword` の失敗が単一の文面 (`invalid email or password`) を返すのは
  user の存在を漏らさないためだが、`signUpWithPassword` に既存 email を渡した時の
  挙動は定義されていない (adapter の `createUser` に委ねている)
