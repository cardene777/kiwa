# test-spec-nextjs-server (e2e-generic layer)

実 Next.js v15 の dev server を起動し、4 つの層 (middleware / RSC page / Server Action /
Route Handler) が **繋がった状態で** どう振る舞うかを対象にする。

各層の純粋な実装は `_kiwa/` 配下に切り出してあり、そちらは単体テストが直接呼ぶ。
本仕様書は **browser と HTTP を経由した時の振る舞い**を中心にし、各層の直接呼出でしか
到達できない分岐は統合境界を説明するために区別して記載する。

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

現在の実装では、`x-kiwa-request-id` の有無が、どちらが応答したかの判別材料になる。

| 応答 | header | 応答した層 |
|---|---|---|
| `/items` の 307 | 無い | middleware (早期に返る) |
| `/api/items` の 302 | **有る** | Route Handler (middleware は素通しして header を付けた) |
| `/items` の 403 (`session=banned`) | 無い | middleware |
| `/api/items` の 403 (`session=banned`) | **無い** | middleware (Route Handler は走っていない) |
| `/api/items` の 403 (`session=banned; session=admin`) | **有る** (`next-default`) | Route Handler |

middleware と Route Handler は `banned` に同じ本文 (`{"error":"banned"}`) を返すため、本文だけでは
区別できない。 単一の `session=banned` では middleware の `banned` 分岐が `env.setHeader` と
Route Handler より先に返る。 実測でも `/api/items` に `banned` と `x-request-id` を同時に送った
403 に header が付かず、middleware を素通しする `admin` では付いた。

ただし、middleware の cookie map と Route Handler の正規表現は同名 cookie の選択規則が違う。
実測で raw header `session=banned; session=admin` は middleware が後方の `admin` として素通しし、
Route Handler は先頭の `banned` を抽出して 403 を返した。 この時は `x-kiwa-request-id` が付く。
header の有無は入力とこの制御フローを組み合わせて判断する。

### session の値と役割の対応

| 抽出・decode 後の cookie の値 | id | 役割 |
|---|---|---|
| `admin` | `u1` | admin |
| `banned` | `u2` | banned |
| **上記以外の、非空かつ decode 可能な値** | `guest` | guest |
| cookie 自体が無い、または空で抽出できない | — | 未認証 |

`guest` は特定の cookie 値ではなく、session resolver が抽出・decode できた値の既定役割。
実測で `session=zzz` と `session=guest` がどちらも `user: "guest"` を返し、
**役割による項目の絞り込みも受けない** (3 件すべてを返す)。

middleware は `NextRequest.cookies`、RSC と Route Handler は再構成または raw の cookie header を
上の resolver へ渡すため、二重 encoding や同名 cookie では層ごとの解釈が一致しないことがある。

空値と不正な percent encoding は guest にならない。 `/api/items` で実測した 4 つの境界。

| cookie | 結果 |
|---|---|
| `session=` | 302 (未認証)。 抽出の正規表現が 1 文字以上を要求するため一致しない |
| `session=%41` | 200 / guest (`A` に decode される) |
| `session=%` | **500** |
| `session=%zz` | **500** |

`decodeURIComponent` が不正な入力で `URIError` を送出し、application code が catch しないため、
Next.js がその要求を 500 に変換する。 server process は停止せず、後続の要求には応答する。

### 層ごとに cookie の読み方が違う

**本仕様書で最も重要な性質。** 3 つの層が同じ cookie を別々の方法で読む。

| 層 | 読み方 | 同名 cookie | percent encoding |
|---|---|---|---|
| middleware | `NextRequest.cookies` | **後方**を採る | 1 回 decode する |
| RSC page | `cookies()` を `name=value` へ再構成 → `auth.ts` の正規表現 | — | 再構成後に **もう 1 回** decode する |
| Route Handler | raw の `cookie` header → `auth.ts` の正規表現 | **前方**を採る | 1 回 decode する |

この差で、**middleware が素通しした要求が後段で別の役割に化ける**。 実測した 4 例。

| raw cookie | `/items` の結果 | `/api/items` の結果 |
|---|---|---|
| `session=%3B` | 200 / **RSC の未認証描画** | 200 / guest |
| `session=%2562anned` | 200 / **RSC の banned 描画** | 200 / guest |
| `session=banned; session=admin` | 200 / 一覧 | 403 / **Route Handler が返す** (header 有り) |
| `session=admin; session=banned` | 403 / middleware が返す (header 無し) | 403 / middleware が返す (header 無し) |

読み方の内訳。

- `%3B` は `;` に decode される。 middleware から見れば非空の未知値なので素通しするが、
  RSC は再構成した `session=;` を正規表現に掛け、`([^;]+)` が 1 文字も取れず未認証になる
- `%2562anned` は middleware が 1 回 decode して `%62anned` (非空・未知) として素通しし、
  RSC が **2 回目の decode** で `banned` に戻す
- 同名 cookie は middleware が後方、Route Handler が前方を採るため、
  並べる順序で「どちらの層が 403 を返すか」 が入れ替わる

**「middleware が先に遮るから後段に到達しない」 は成り立たない。**
遮る判定と後段の判定が同じ入力を別々に読むため、両者が食い違う入力を作れる。

### `/api/items` の統合応答

| 条件 | status | body | 主な response header |
|---|---|---|---|
| session 不在 | 302 | 空 | `location: /login?from=%2Fapi%2Fitems`、`x-kiwa-request-id: next-default` |
| 単一の `session=banned` | 403 | `{"error":"banned"}` | `content-type: application/json`、`x-kiwa-request-id` は無い |
| `session=banned; session=admin` | 403 | `{"error":"banned"}` | `content-type: application/json`、`x-kiwa-request-id: next-default` |
| decode 不能な session (`%` / `%zz`) | 500 | 空 | `x-kiwa-request-id: next-default` |
| admin または guest に解決された session | 200 | `{items, count, user}` | `cache-control: public, max-age=60`、`x-kiwa-request-id` |

単一の `session=banned` は Route Handler まで届かない。 `/api/` は middleware の範囲内なので、
middleware が先に 403 を返す (実装の早期 return と header 欠落の実測が根拠)。 一方、同名 cookie を
重ねると上記の選択規則の差で Route Handler 側の `banned` 分岐にも HTTP 経由で到達できる。

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

### browser と server の検証境界

`app/items/create-form.tsx` の input は `required` と `minLength={2}` を持つ。
browser は trim 前の入力を検証し、server は trim 後の文字数を検証する。 そのため、空欄と
1 文字をそのまま submit すると browser が止めるが、server 側の 2 分岐も form から到達できる。

| server 側の分岐 | form から到達する入力 |
|---|---|
| 空 → `name is required` | 空欄そのものは browser が止める。空白 2 文字なら browser を通り、trim 後に到達する |
| 2 文字未満 → `name must be at least 2 characters` | 1 文字そのものは browser が止める。` a` なら browser を通り、trim 後に到達する |
| `danger` → 例外 | する |

実測で 1 文字 (`x`) と空欄を submit したところ、成功も失敗も画面に出なかった
(submit 自体が起きていない)。 この観測は、その 2 入力だけが browser で止まることを示す。
server の 2 分岐自体は単体テストが直接呼んで確かめているが、現行 e2e は空白を含む到達経路を
確かめていない。

### 生成される id の決まり方

```
id = (seed を 10 進数として parse した値。非数値なら 100) + trim 後の name の文字数
```

form の hidden seed は 100。 実測で `hello` (trim 後 5 文字) が 105、`ab` (trim 後 2 文字) が
102 になった。 入力の前後の空白は文字数に含めず、乱数も時刻も使わない。

## 主な品質リスク

- **未認証時の status が経路で違う**。 middleware は 307、Route Handler は 302。
  どちらも `/login?from=` へ導くが、番号で分岐する client は経路ごとに違う扱いをする
- **`x-kiwa-request-id` は素通しの時だけ付く**。 追跡用の header を必須とみなす監視を組むと、
  middleware が返す 403 と 307 で欠落する
- **`banned` の 403 が二重に定義されている**。 単一の cookie では middleware が返すが、同名 cookie を
  重ねると Route Handler 側にも到達する。 片方だけ直すと入力によって結果が割れる
- **`limit` が正の値でしか効かない**。 `0` と非数値がどちらも「絞り込まない」 に倒れるため、
  利用側が 0 件を期待すると全件が返る
- **guest が既定**。 非空かつ decode 可能な未知の cookie 値が guest として通るため、
  有効な session 値を知らなくても decode 可能な未知値で項目一覧が読める。 PoC の範囲では意図した挙動だが、
  本番でこの既定を残すと認可が空洞化する
- **browser と server で検証対象が違う**。 browser は trim 前、server は trim 後の文字数を見るため、
  空白を含む入力は browser を通って server error になる。 非 browser client も server 側の検証に届く
- **不正な cookie で 500 になる**。 `resolveUserFromCookieHeader` の `decodeURIComponent` が
  `URIError` を送出し、application code が catch しない。 実測で `session=%` と `session=%zz` が
  ともに 500 を返したが、server process は停止せず後続要求へ応答した。
  認証前の経路なので **誰でも送れる**。 未認証は 302、`banned` は 403 と分岐が整理されている中で、
  この 1 つだけが 5xx に落ちる

## 推奨テスト構成

`playwright.config.ts` の `webServer` が `next dev --port 3070` を起動する。
`reuseExistingServer: false` なので Playwright の run ごとに新しい server が立つ。 同じ run 内の
7 件はその server を共有するため、server 側に可変状態を足した場合は test 間で持ち越されうる。

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
| T-E2E-004 | form submit の結果が画面に返る | `session=admin` | `name` に `hello` を入れて submit | `create-success` が `id=105` と `hello` を含む (seed 100 + trim 後の文字数 5) | P0 | yes | ssr | `/items` |
| T-E2E-005 | 未認証の API は 302 で login を指す | cookie 無し | `request.get('/api/items', { maxRedirects: 0 })` | `status===302`、`location==='/login?from=%2Fapi%2Fitems'` (middleware の 307 とは別経路) | P0 | yes | ssr | `/api/items` |
| T-E2E-006 | 認証済の API が一覧と cache 指示を返す | `session=admin` | `request.get('/api/items')` | `status===200`、`cache-control==='public, max-age=60'`、`count===3`、`user==='u1'` | P0 | yes | ssr | `/api/items` |
| T-E2E-007 | 追跡用 header が素通しの経路で引き継がれる | `session=admin` かつ `x-request-id: req-e2e-7` | `request.get('/api/items')` | `status===200`、`x-kiwa-request-id==='req-e2e-7'` | P1 | yes | ssr | `/api/items` |

## 自動化方針

7 件はすべて `webServer` が起動した実 dev server に対して走る。 mock を持たない。

**T-E2E-001 と T-E2E-005 は同じ「未認証で login へ導く」 挙動を別の経路で見ている。**
前者は middleware の redirect を追って最終の 200 と URL を確かめるが、途中の 307 自体は
assert しない。 後者は Route Handler の 302 を追わずに status と `location` を直接読む。
T-E2E-001 だけでは 307 を保証できないため、middleware の status も保証するなら
`maxRedirects: 0` の要求を別途加える必要がある。

**この 7 件が覆っていない範囲**を明示する。 通常の cookie では middleware に遮られる分岐も、
層ごとの cookie 解釈がずれる境界入力なら HTTP から到達できる。 `_kiwa/` の直接呼出テストだけでは、
この統合境界のずれは観測できない。

| 覆っていないもの | HTTP / browser からの到達 | 理由 |
|---|---|---|
| `guest` 役割の応答 | できる | 未知の非空 cookie 値を使う e2e が無い |
| `tag` と `limit` の絞り込み | できる | 既定 (絞り込みなし) だけを assert している |
| `limit=0` と非数値の扱い | できる | query の境界値を送る e2e が無い |
| server 側の name 検証 2 分岐 | できる | 空白 2 文字や ` a` を submit する e2e が無い |
| `danger` の例外 | できる | `danger` を submit する e2e が無い |
| RSC の未認証 / banned 描画 | できる | `session=%3B` で未認証、`session=%2562anned` で banned の描画へ到達するが e2e が無い |
| Route Handler の `banned` 分岐 | できる | `session=banned; session=admin` なら middleware を通るが、この境界入力の e2e が無い |
| `x-kiwa-request-id` の既定値 `next-default` | できる | T-E2E-006 は `x-request-id` 無しで要求するが、この response header を assert していない |
