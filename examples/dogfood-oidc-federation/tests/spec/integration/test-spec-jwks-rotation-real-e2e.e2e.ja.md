# test-spec-jwks-rotation-real-e2e (e2e-generic layer)

実 Keycloak を container で起こし、**署名鍵の入れ替え (rotation) の前後で id_token が
検証できるか**を jose で確かめる。

他の e2e-generic の例と違い、**browser を 1 度も開かない**。 vitest から Node の
`fetch` で Keycloak の REST API を直接叩き、jose の `jwtVerify` が RS256 の署名を
実際に検証する。 mock adapter を HTTP の口として載せる形でもない。

- module: jwks-rotation-real-e2e
- layer: e2e-generic

## 対象機能

| 経路 | 何をするか | helper |
|---|---|---|
| `POST {baseUrl}/realms/master/protocol/openid-connect/token` | 管理 token を取る (`admin-cli` / password grant) | `obtainKeycloakAdminToken` |
| `GET {baseUrl}/admin/realms/{realm}/components?type=org.keycloak.keys.KeyProvider` | 鍵 provider を列挙する | `listKeycloakRealmKeyComponents` |
| `POST {baseUrl}/admin/realms/{realm}/components` | 優先度の高い provider を足す (= rotation) | `createKeycloakRealmKeyComponent` |
| `DELETE {baseUrl}/admin/realms/{realm}/components/{id}` | provider を消す (= 保持期間切れの模擬) | `deleteKeycloakRealmKeyComponent` |
| `GET {baseUrl}/admin/realms/{realm}/keys` | kid と所有 provider を対応付ける | `findOwnerComponent` (test file 内) |
| `GET {issuer}/protocol/openid-connect/certs` | JWKS を取る | `fetchJwksFromKeycloak` / jose `createRemoteJWKSet` |
| `POST {issuer}/protocol/openid-connect/token` | id_token を発行する (password grant) | `mintIdTokenFromKeycloak` |
| `POST .../clients` + `POST .../users` | client と user を用意する | `ensureKeycloakConfidentialClient` |

## 仕様の要約

### 起動と gate

`describe.runIf(process.env['OIDC_BOOTSTRAP'] === '1')` で囲われている
(`jwks-rotation-real-e2e.spec.ts:133`、 判定値は `81` 行)。 **`'1'` との厳密比較**なので
`OIDC_BOOTSTRAP=true` では動かない。

`tsconfig.vitest.json` の `include` は `tests/**/*` なので、この file 自体は
既定の `pnpm test` でも読み込まれる。 走らないのは `runIf` が false になるためで、
file が除外されているからではない。

container は `quay.io/keycloak/keycloak:26.0` を `start-dev` で起こし、
待ち条件は起動 log の `/started in/` (`real.ts:342`)。 file 全体で 1 container を
`beforeAll` で 1 度だけ用意し、4 つの test が同じ handle を使い回す。

### rotation の規則 (`real.ts:516-583`)

本 test が `options.priority` を渡さない既定経路では、新しい provider の優先度は
**既存の最大値 + 100** (`real.ts:535`)。 最大値は初期値 0 の `reduce` で取るので負にはならない。
明示した `options.priority` はこの計算を上書きできる。 provider は `rsa-generated` / RS256 / 2048 bit /
`enabled` + `active` の固定で、既定名は `kiwa-e2e-rotate-{Date.now()}-{priority}`。

**古い provider を無効にしない**ので、その鍵は `/certs` に残り続ける。 これが
「保持期間の窓が開いている」 状態にあたる。

成功とみなすのは **201 だけ** (`real.ts:559`)。 新しい id は `Location` header の末尾 segment から取り、
取れなければ throw する。 その後もう 1 度 list し直し、id で引けなければ throw する
(`POST` の応答 body が空で、kid は server 側で作られるため)。

### active な署名鍵の決まり方 (`real.ts:487-513`)

`listKeycloakRealmKeyComponents` は `config.priority[0]` を数値にして
**降順に並べ替えて**返す。 doc comment は「先頭を現在の active provider として扱ってよい」
と書く。

**比較子は priority だけを見る**。 同じ優先度の provider が複数あるとき比較子は 0 を返し、
`Array.prototype.sort` は安定なので Keycloak の応答順がそのまま残る。 列挙には
`/certs` に出ない provider (`hmac-generated` / `aes-generated`) も含まれる。

### 削除の規則 (`real.ts:590-606`)

**204 と 404 の両方を成功として扱う** (`real.ts:600`)。 それ以外は throw する。 つまり「消えた」 と
「元から無い」 を呼出側から区別できない。

### JWKS の取り方 (`real.ts:216-232`)

issuer の末尾の `/` を落として `/protocol/openid-connect/certs` を付ける。
2xx 以外は throw。 応答に `keys` が無ければ **空配列**を返す (`real.ts:226`、 throw しない)。

test 側は `use === 'sig'` で絞り、空の kid を落として扱う。

### 管理 token は操作ごとに取り直す

`obtainKeycloakAdminToken` に cache は無い。 rotation 1 回で **3 回**取る
(前段の list で 1 回、`createKeycloakRealmKeyComponent` 自身で 1 回、
再 list で 1 回)。

### 待ち方 (`jwks-rotation-real-e2e.spec.ts:94-113`)

`waitForKidInJwks` は 250 ms 間隔で `/certs` を取り直し、述語が真になった時点の
sig kid の一覧を返す。 既定の上限は 10 秒で、超えると **最後に見た一覧を含めて throw** する (`spec.ts:110`)。
`setTimeout` を直に置かないのはこのため。

jose 側は `cacheMaxAge: 100` / `cooldownDuration: 100` (ミリ秒、 `spec.ts:127-128`) を渡す。
ただし各 test は rotation / 削除の後に remote JWK set を作るため、既存 cache の更新は測っていない。

## 主な品質リスク

| # | リスク | 中身 |
|---|---|---|
| 1 | 実 container 依存 | Docker が要る。 初回 pull を含めて 30-60 秒、`beforeAll` の上限は 180 秒 |
| 2 | gate の厳密比較 | `=== '1'` なので `OIDC_BOOTSTRAP=true` では静かに走らない。 走らなくても pass する |
| 3 | test 間で状態が積み上がる | 1 container を 4 test で共有し、rotation は provider を足す一方。 先に走った test が作った provider が次の test の初期状態になる |
| 4 | 後始末が元に戻らない場合がある | `afterAll` の説明は「key ring を開始時と同じ形に戻す」 だが、消した provider を作り直す経路は無い。 4b は消した id を掃除の一覧から取り除くだけ |
| 5 | 4b が消す相手が固定でない | 消すのは「その時点で mint した token の kid を持つ provider」。 どれになるかは同じ file で先に走った rotation の結果で変わる |
| 6 | `Mode` の 4 値がどれも当たらない | 列の定義は `static` / `fetch` / `node` / `ssr` で、いずれも browser を前提にする。 本 test は browser を開かない |
| 7 | 待ちの述語が件数だけを見る箇所がある | 4c の待ちは `surface.length >= baselineSigCount + i + 1` で、増えた kid が何かを見ていない |

## 推奨テスト構成

| 層 | 何を置くか |
|---|---|
| 実 driver e2e (本 spec) | Keycloak を起こして rotation の前後を jose で検証する。 `OIDC_BOOTSTRAP=1` でのみ走る |
| mock e2e | `tests/jwks-rotation-e2e.spec.ts` が同じ 4 軸を `@kiwa-lab/auth` の `setupOidcEnv` で覆う。 既定の `pnpm test` で毎回走る |
| 単体 | `tests/keycloak-real-driver.spec.ts` が実 driver の env 不在時の振る舞いを覆う |

実 driver 側が重いので、**軸そのものの回帰は mock 側で毎回、実 driver は release gate で**という
分担になっている。

## テスト観点一覧

| 観点 | 中身 |
|---|---|
| 保持期間の内側 | rotation で kid が増えても、前の kid で署名された token が検証できる |
| 保持期間の外側 | provider を消すと、その kid の token は `JWKSNoMatchingKey` で拒まれる |
| 複数回の rotation | 2 回の rotation 後、3 回の mint で控えた kid が全て `/certs` に含まれる |
| 新しい鍵の利用可能性 | 新しい kid が `/certs` に現れた後に mint した token が、その kid で署名されて検証できる |
| RP 側の JWKS 取得 | jose の `createRemoteJWKSet` が現在の JWKS を初回取得して検証に使う。既存 cache の更新は測らない |
| 署名の本物性 | RS256 の署名検証と `iss` / `aud` の照合を実際に通す |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 保持期間の内側で、rotation 前の kid の token が検証できる | `OIDC_BOOTSTRAP=1` で起きた Keycloak と、用意済みの confidential client + user | `/certs` の sig kid を控えて id_token を mint し、優先度の高い provider を足す。 kid が増えて前の kid も残るまで待つ | 追加前の kid が `/certs` に残り、集合の件数が増える。 jose の `jwtVerify` が `issuer` と `audience` 込みで通り、`payload.sub` が空でなく `protectedHeader.kid` が rotation 前の kid | P0 | yes | node | `/admin/realms/{realm}/components` `/protocol/openid-connect/certs` `/protocol/openid-connect/token` |
| T-E2E-002 | 保持期間の外側では kid が見つからず拒まれる | 同上 | mint した token の kid を持つ provider を `/keys` から特定し、先に rotation してから **その provider を消す**。 `/certs` から kid が消えるまで最大 30 秒待つ | `jwtVerify` が拒否し、理由が jose の `JWKSNoMatchingKey` | P0 | yes | node | `/admin/realms/{realm}/keys` `/admin/realms/{realm}/components/{id}` `/protocol/openid-connect/certs` |
| T-E2E-003 | 2 回の入れ替えをまたいで控えた kid が残る | 同上 | mint → rotation → mint → rotation → mint を回す (最後の mint の後は入れ替えない) | `kids` 配列の 3 要素が全て `/certs` に含まれ、3 つの token が全て `jwtVerify` を通る。 各 token の `protectedHeader.kid` が控えた kid の集合に含まれる | P0 | yes | node | `/admin/realms/{realm}/components` `/protocol/openid-connect/certs` |
| T-E2E-004 | 増えた kid が `/certs` に現れた後、その鍵で mint できる | 同上 | provider を列挙して先頭の id を控え、rotation して kid が増えるまで待つ。 増えた kid を特定してから id_token を mint する | 増えた kid はちょうど 1 件。 token の header がその kid で `alg` が `RS256`。 `jwtVerify` が通り `payload.iss` が issuer、署名を検証せず `decodeJwt` で読んだ `sub` が検証後の `sub` と一致 | P0 | yes | node | `/admin/realms/{realm}/components` `/protocol/openid-connect/token` |

`Mode` はどの値も正確ではない (§ 主な品質リスク の 6)。 server を起こして
その口を叩く形が一番近いので `node` を置いた。 `Route` は browser の URL ではなく
実際に叩く Keycloak の endpoint を書いている。

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-oidc-federation/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` / `.next` / `.turbo` / `dist` / `.vitest-dist` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir。 `tests/perf/` にも 1 file あるが `.perf.ts` なので 4 つの suffix に当たらず数に入らない
- 探索した test file — 12 件

| TC | 実 test | 何を assert しているか | 覆っていないこと |
|---|---|---|---|
| T-E2E-001 | `tests/e2e/jwks-rotation-real-e2e.spec.ts:169` | 8 件。 rotation 前の sig kid が 1 件以上、header の kid が空でない、`alg` が `RS256`、その kid が rotation 前の集合にある、rotation 後も残る、件数が増える、`jwtVerify` 後の `payload.sub` が空でない、`protectedHeader.kid` が rotation 前の kid | **増えた kid が新しい active signer になったこと**を見ていない。 待ちの述語も「件数が増え、前の kid が全て残る」 までで、増えた kid が何かは特定しない |
| T-E2E-002 | `tests/e2e/jwks-rotation-real-e2e.spec.ts:223` | 2 件。 mint した token の kid が空でない、`jwtVerify` が `joseErrors.JWKSNoMatchingKey` で拒否 | **署名そのものの失敗** (kid は見つかるが署名が合わない) は見ていない。 削除の応答 status も見ていない (helper が 204 / 404 以外なら throw するだけ) |
| T-E2E-003 | `tests/e2e/jwks-rotation-real-e2e.spec.ts:296` | assert 文は 2 つ (`339` 行 / `349` 行) で、どちらも 3 要素の loop の中にあるため実行時は 6 件。 `kids` 配列の 3 要素が `/certs` に含まれる (3 件)、3 つの token が `jwtVerify` を通り `protectedHeader.kid` が控えた集合に含まれる (3 件) | `it` 名は three consecutive rotations だが、body の rotation は **2 回**。 また、3 要素の kid が互いに違うことを assert していない。 `toContain` なので同じ kid が 3 回並んでも通る。 待ちの述語も件数だけを見る |
| T-E2E-004 | `tests/e2e/jwks-rotation-real-e2e.spec.ts:355` | 7 件。 rotation 前の先頭 component の id が空でない、増えた kid がちょうど 1 件、header の kid がそれ、`alg` が `RS256`、`payload.sub` が空でない、`payload.iss` が issuer、`decodeJwt` した `sub` が一致 | 控えた `preActiveComponentId` を **空でないこと以外に使っていない**。 rotation で優先度が実際に上がったことを provider 側から確かめていない。 また、mint 前に `/certs` への反映を待つため、rotation 直後の待ち時間なしの利用は測らない |

TC の ID は `it()` に直接書かれている (wrapper を挟まないので、名前の直書きを探す走査でも
見つかる)。 上の行番号は `it(` の行を指す。

## 自動化すべきテスト

4 件とも自動化済み。 追加するなら以下 5 つで、いずれも同じ container で書ける。

| 追加 | 何を確かめるか |
|---|---|
| 増えた kid が active signer か | 4a でも rotation 後に mint し、その kid が「増えた側」 と一致することを見る (今は 4d が `/certs` への反映待ち後にだけ持つ) |
| kid が互いに違うこと | 4c で 3 つの kid を集合にして件数が 3 であることを見る |
| 署名の取り違え | 別の realm で mint した token を検証させ、`JWKSNoMatchingKey` ではなく署名側の拒否が出ることを見る |
| RP 側の JWKS cache 更新 | 同じ remote JWK set を rotation 前に一度使って cache を作り、rotation 後の新しい kid で再取得が起きることを見る |
| 優先度の同値 | 同じ優先度の provider を 2 つ作り、列挙の先頭がどちらになるかを見る (§ 不足している仕様 の 2) |

## 手動確認でよいテスト

| 対象 | 理由 |
|---|---|
| Keycloak の管理画面での見え方 | 本 spec は REST API しか触らない。 画面の表示は Keycloak 側の責務 |
| image tag を上げたときの互換 | `26.0` 固定なので、上げるときに 1 度手で通せばよい。 毎回の自動化に見合わない |

## 不足している仕様

| # | 項目 | 中身 |
|---|---|---|
| 1 | `KIWA_OIDC_ENV_MISSING` が何を意味するか | `interface.ts:108-111` は「実 driver が環境無しで動いたときに出す」「test がこれを見て一律に skip できる」 と書く。 実際には `real.ts` の error message が **22 分岐** (21 個の `throw` のうち `901` 行だけが 2 分岐)あり、意味が 4 通りに割れている。 環境が無い (5 箇所 — `834` / `904` / `922` / `932` と、testcontainers が入っていない `313`)、同期の口では返せないので非同期版を先に呼べ (2 箇所 — `850` / `903`)、この機能は adapter の範囲外 (1 箇所 — `877`、 環境を見ずに必ず throw する)、**動いている container への操作が失敗した** (14 箇所 / helper 9 個 — `178` `222` `405` `437` `443` `504` `562` `570` `579` `603` `663` `703` `735` `744`)。 4 番目は環境不足ではないのに、doc comment に従う消費側は skip に倒れる |
| 2 | 優先度が同値のときどれが active か | `real.ts:487-492` は「先頭を active provider として扱ってよい」 と書くが、比較子は priority だけを見る (`real.ts:512`)。 同値なら 0 を返して Keycloak の応答順が残る。 どれを active とみなすかが決まっていない |
| 3 | 「保持期間の窓」 が何で閉じるか | `real.ts:518-521` は古い provider を残すことを「Keycloak 内蔵の保持期間の窓」 と呼ぶ。 窓を閉じる条件はどこにも書かれておらず、実際に閉じる経路は明示的な削除だけになっている。 4b が「保持期間切れ」 を削除で模擬しているが、期限切れと削除が同じ扱いでよいかは決まっていない |
