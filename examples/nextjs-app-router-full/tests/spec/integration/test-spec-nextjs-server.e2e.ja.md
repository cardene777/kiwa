# test-spec-nextjs-server (e2e-generic layer)

実 Next.js v15 の dev server を起動し、4 つの層 (middleware / RSC page / Server Action /
Route Handler) が **繋がった状態で** どう振る舞うかを対象にする。

各層の純粋な実装は `_kiwa/` 配下に切り出してあり、そちらは単体テストが直接呼ぶ。
本仕様書が扱うのは **browser と HTTP を経由した時にだけ現れる振る舞い**に限る。

- module: nextjs-server
- layer: e2e-generic

## 対象機能

| 層 | 実体 | 経路 |
|---|---|---|
| middleware | `middleware.ts` → `lib/_kiwa/auth-middleware.ts` | `/items/:path*` と `/api/:path*` |
| RSC page | `app/items/page.tsx` → `app/items/_kiwa/items-rsc.ts` | `/items` |
| Server Action | `app/items/actions.ts` → `app/items/_kiwa/items-action.ts` | `/items` の form |
| Route Handler | `app/api/items/route.ts` → `app/api/items/_kiwa/route-handler.ts` | `/api/items` |

## 仕様の要約

### middleware が効く範囲

`middleware.ts` の `config.matcher` は `/items/:path*` と `/api/:path*` の 2 つ。

`/` と `/login` は範囲外で、middleware を 1 度も通らない。
実測で `x-kiwa-request-id` が付かないことを確認した。

### middleware の 3 分岐

判定は **session cookie の値だけ**で行う。 header も path も、その後に見る。

| 条件 | 動作 | `x-kiwa-request-id` |
|---|---|---|
| `session === 'banned'` | 403 + `{"error":"banned"}` | **付かない** |
| session 不在 かつ path が `/items` で始まる | 307 で `/login?from=<encode 済 path>` へ | **付かない** |
| それ以外 | 素通し | 付く |

**header が付くのは素通しの分岐だけ**。 403 と 307 は `env.setHeader` に到達する前に返るため、
`x-kiwa-request-id` を持たない。 実測で 307 の応答に header が無いことを確認した。

`session` 不在で path が `/api/` の場合は素通しになるため、判定は Route Handler が行う。
**middleware と Route Handler で未認証時の status が違う** (307 と 302)。

`x-kiwa-request-id` の有無が、どちらが応答したかの判別材料になる。

| 応答 | header | 応答した層 |
|---|---|---|
| `/items` の 307 | 無い | middleware (早期に返る) |
| `/api/items` の 302 | **有る** | Route Handler (middleware は素通しして header を付けた) |
| `/items` の 403 | 無い | middleware |
| `/api/items` の 403 | **無い** | middleware (Route Handler は走っていない) |

最後の行が要点。 middleware と Route Handler は `banned` に同じ本文 (`{"error":"banned"}`) を
返すため、本文だけでは区別できない。 header の欠落が「middleware で止まった」 ことを示す。
実測で `/api/items` に `banned` と `x-request-id` を同時に送り、403 に header が付かないこと
(対照として `admin` では付くこと) を確認した。

### session の値と役割の対応

| cookie の値 | id | 役割 |
|---|---|---|
| `admin` | `u1` | admin |
| `banned` | `u2` | banned |
| **上記以外の任意の文字列** | `guest` | guest |
| cookie 自体が無い | — | 未認証 |

`guest` は既定であって、特定の値ではない。 実測で `session=zzz` と `session=guest` が
どちらも `user: "guest"` を返し、**項目の絞り込みも受けない** (3 件すべてを返す)。

### Route Handler の応答

| 条件 | status | body | header |
|---|---|---|---|
| session 不在 | 302 | 空 | `location: /login?from=%2Fapi%2Fitems` |
| `banned` | 403 | `{"error":"banned"}` | — |
| それ以外 | 200 | `{items, count, user}` | `cache-control: public, max-age=60` |

**この 403 は Route Handler まで届かない。** `/api/` は middleware の範囲内なので、
`banned` は middleware が先に 403 を返す (上表の header 欠落が根拠)。
Route Handler 側の `banned` 分岐は HTTP 経由では到達できず、
単体テストが直接呼んで初めて通る。

302 の方は Route Handler に届く。 未認証は middleware の `/items` 判定に当たらないため
素通しし、Route Handler が 302 を返す。

### 絞り込みの境界 (`/api/items`)

| query | 件数 | 理由 |
|---|---|---|
| `?tag=react` | 2 | tag を含む項目だけ |
| `?tag=react&tag=test` | 3 | 複数指定は **OR** (どれか 1 つ含めば通る) |
| `?tag=nope` | 0 | 一致なし |
| `?limit=2` | 2 | 先頭から 2 件 |
| `?limit=0` | **3** | `limit > 0` が偽なので絞り込まない |
| `?limit=abc` | **3** | 数値にならないので絞り込まない |

`limit=0` を「0 件」 と読まない。 実装は正の値でだけ絞る。

### form が到達できない検証分岐

`app/items/create-form.tsx` の input は `required` と `minLength={2}` を持つ。
browser がこの 2 つを先に見るため、**server 側の 2 つの検証分岐は form から到達できない**。

| server 側の分岐 | form から到達するか |
|---|---|
| 空 → `name is required` | **しない** (`required` が submit を止める) |
| 2 文字未満 → `name must be at least 2 characters` | **しない** (`minLength` が止める) |
| `danger` → 例外 | する |

実測で 1 文字 (`x`) と空欄を submit したところ、成功も失敗も画面に出なかった
(submit 自体が起きていない)。 この 2 分岐は単体テストが直接呼んで確かめる。

### 生成される id の決まり方

```
id = seed (form の hidden、既定 100) + name の文字数
```

実測で `hello` (5 文字) が 105、`ab` (2 文字) が 102 になった。 乱数も時刻も使わない。

## 主な品質リスク

- **未認証時の status が経路で違う**。 middleware は 307、Route Handler は 302。
  どちらも `/login?from=` へ導くが、番号で分岐する client は経路ごとに違う扱いをする
- **`x-kiwa-request-id` は素通しの時だけ付く**。 追跡用の header を必須とみなす監視を組むと、
  403 と 307 で欠落する
- **`banned` の 403 が二重に定義されている**。 middleware と Route Handler が同じ本文を返すが、
  HTTP 経由で通るのは middleware 側だけ。 片方だけ直すと単体テストと e2e で結果が割れる
- **`limit` が正の値でしか効かない**。 `0` と非数値がどちらも「絞り込まない」 に倒れるため、
  利用側が 0 件を期待すると全件が返る
- **guest が既定**。 未知の cookie 値がすべて guest として通るため、cookie を推測されると
  項目一覧が読める。 PoC の範囲では意図した挙動だが、本番でこの既定を残すと認可が空洞化する
- **form の検証が browser 側に依存している**。 `required` と `minLength` を外すと
  server 側の分岐が初めて露出する。 API を直接叩く client には最初から効かない

## 推奨テスト構成

`playwright.config.ts` の `webServer` が `next dev --port 3070` を起動する。
`reuseExistingServer: false` なので実行ごとに新しい server が立ち、状態は持ち越さない。

**redirect を追うかどうかで見えるものが変わる。**
`page.goto` は追うため最終の 200 を返し、`request.get({ maxRedirects: 0 })` は
途中の 307 / 302 とその `location` を返す。 何を確かめたいかで使い分ける。

cookie は `context.addCookies` (画面経由) と `headers.cookie` (要求経由) の 2 通りで渡す。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | middleware の redirect | 未認証の `/items` |
| 2 | RSC の描画 | 認証後の項目一覧 |
| 3 | middleware の遮断 | `banned` の 403 |
| 4 | Server Action の往復 | form submit と結果の表示 |
| 5 | Route Handler の未認証 | 302 と `location` |
| 6 | Route Handler の応答 | 本文と `cache-control` |
| 7 | header の引き継ぎ | `x-request-id` → `x-kiwa-request-id` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 未認証の `/items` が login へ導かれる | cookie 無し | `page.goto('/items')` で redirect を追う | 最終の `status===200`、URL が `/login?from=%2Fitems` で終わる | P0 | yes | ssr | `/items` |
| T-E2E-002 | 認証後に項目一覧が描画される | `session=admin` | `page.goto('/items')` | `status===200`、`h1` が `kiwa Next.js PoC`、`li` が 3 件で `kiwa` / `nextjs` / `app-router` を順に含む | P0 | yes | ssr | `/items` |
| T-E2E-003 | `banned` は画面に到達しない | `session=banned` | `page.goto('/items')` | `status===403` (middleware が返す。RSC の banned 分岐は通らない) | P0 | yes | ssr | `/items` |
| T-E2E-004 | form submit の結果が画面に返る | `session=admin` | `name` に `hello` を入れて submit | `create-success` が `id=105` と `hello` を含む (seed 100 + 文字数 5) | P0 | yes | ssr | `/items` |
| T-E2E-005 | 未認証の API は 302 で login を指す | cookie 無し | `request.get('/api/items', { maxRedirects: 0 })` | `status===302`、`location==='/login?from=%2Fapi%2Fitems'` (middleware の 307 とは別経路) | P0 | yes | ssr | `/api/items` |
| T-E2E-006 | 認証済の API が一覧と cache 指示を返す | `session=admin` | `request.get('/api/items')` | `status===200`、`cache-control==='public, max-age=60'`、`count===3`、`user==='u1'` | P0 | yes | ssr | `/api/items` |
| T-E2E-007 | 追跡用 header が素通しの経路で引き継がれる | `session=admin` かつ `x-request-id: req-e2e-7` | `request.get('/api/items')` | `status===200`、`x-kiwa-request-id==='req-e2e-7'` | P1 | yes | ssr | `/api/items` |

## 自動化方針

7 件はすべて `webServer` が起動した実 dev server に対して走る。 mock を持たない。

**T-E2E-001 と T-E2E-005 は同じ「未認証で login へ導く」 挙動を別の経路で見ている。**
前者は middleware の 307 を redirect ごと追って最終の 200 を確かめ、
後者は Route Handler の 302 を追わずに `location` を直接読む。
番号が違うのは経路が違うためで、片方の観測だけでは両方を保証できない。

**この 7 件が覆っていない範囲**を明示する。 いずれも HTTP や browser を経由すると
到達できないため、単体テストが `_kiwa/` の関数を直接呼んで確かめる。

| 覆っていないもの | 理由 |
|---|---|
| `guest` 役割の応答 | 未知の cookie 値がすべて guest になる経路を e2e で 1 件も通していない |
| `tag` と `limit` の絞り込み | 既定 (絞り込みなし) だけを通している |
| `limit=0` と非数値の扱い | 上と同じ |
| server 側の name 検証 2 分岐 | browser の `required` と `minLength` が先に止める |
| `danger` の例外 | e2e で submit していない |
| RSC の未認証 / banned 描画 | middleware が先に返すため画面に到達しない |
| Route Handler の `banned` 分岐 | 同上 |
| `x-kiwa-request-id` の既定値 `next-default` | header を付けない要求を e2e で送っていない |
