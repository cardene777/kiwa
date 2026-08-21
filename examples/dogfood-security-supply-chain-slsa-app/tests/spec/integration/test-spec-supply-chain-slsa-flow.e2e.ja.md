# test-spec-supply-chain-slsa-flow (e2e-generic layer)

供給網の等級判定 / 再現可能な build の照合 / 由来の署名と検証 / 4 つを束ねた出荷判断の
4 経路を、Chromium の BrowserContext に紐づく Playwright `APIRequestContext` から順に叩いて確かめる。

画面は描画しない。 `src/lib/next-server.ts` が 4 route を node server に載せ、
Playwright の `page.request` が JSON を投げる。これは `page.context().request` と同じ
API testing helper で、Chromium page 内の `fetch` ではない。

**git 追跡下の `dogfood-security-*` 6 例のうち、route が 4 つあるのは本 example だけになる。**
残り 5 例は 3 つで、本 example だけ束ねる側の入力が 4 系統になる。
route が増えた分だけ kind は少なく、`/supply-chain` と `/reproducible` と `/sc-orchestrator` は
kind を 1 つしか持たない。

server code が明示的に設定する response header は `content-type: application/json` だけで、
等級も照合結果も JSON body の field として返る。

実測した実 response header は下の 5 つで、`content-type` 以外は Node が付ける。

```
content-type: application/json
date: ...
connection: keep-alive
keep-alive: timeout=5
content-length: ...
```


- module: supply-chain-slsa-flow
- layer: e2e-generic

## 対象機能

| 経路 | kind | 実体 |
|---|---|---|
| `POST /supply-chain` | `verify-slsa-level` の 1 つ | `src/app/supply-chain/route.ts` → `src/adapters/mock.ts` |
| `POST /reproducible` | `match-build` の 1 つ | `src/app/reproducible/route.ts` → 同上 |
| `POST /attestation` | `sign-provenance` / `verify-attestation` の 2 つ | `src/app/attestation/route.ts` → 同上 |
| `POST /sc-orchestrator` | `decide` の 1 つ | `src/app/sc-orchestrator/route.ts` → 同上 |

## 仕様の要約

### 検証の失敗も 200 で返る

status で成否を判別できない。

| 種別 | status | body |
|---|---|---|
| 成功 | 200 | `{ok: true, ...}` |
| **route validator の検証失敗** | **200** | `{ok: false, errorKind: '...'}` |
| **route handler が捕捉した adapter の失敗** | **200** | `{ok: false, kind, ..., errorKind: '...'}` |
| 壊れた JSON | 400 | `{ok: false, errorKind: 'body_parse_failed'}` |
| 未知の path | 404 | `{ok: false, errorKind: 'route_not_found'}` |
| POST 以外の method | 405 | `{ok: false, errorKind: 'method_not_allowed'}` |
| dispatch が応答 object を返さず例外を投げた時 | 500 | `{ok: false, errorKind: 'dispatch_failed'}` |

dispatcher の request 処理は `dogfood-security-sbom-scanning-app` と同一で、
`createServer` の callback と `matchRoute` / `readJson` を切り出して `diff` を取ると
**いずれも差分 0 行** になる。 違うのは `ROUTE_MAP` の 4 entry と `dispatch` の分岐だけになる。

**404 は POST でしか出ない。** 実測で `POST /missing` は 404、`GET /supply-chain` と
`GET /missing` はどちらも 405 になった。

### 束ねる側から見た起動の順序が、下の実装では 1 本の直線になっている

**この仕様書で最も重要な性質。**

`packages/security/src/semantics/supply-chain.ts` の状態機械は
`idle` → `slsa-verified` → `reproducible-matched` → `provenance-signed` → `attestation-verified` の
**1 本** で、4 操作すべてがこの直線の上に並ぶ。

一方この example は、その直線を **3 つの独立した session** に割り当てる。

| adapter 呼出 | 作る session | 支える route |
|---|---|---|
| `startSlsa` | 1 つ目 | `/supply-chain` |
| `startReproducible` | 2 つ目 | `/reproducible` |
| `startAttestation` | 3 つ目 | `/attestation` |

割り当てた結果、2 つ目と 3 つ目の session は直線の途中から始める必要が出る。
そこで **bootstrap が前段を偽の入力で先に走らせる**。

| bootstrap | 何を先に走らせるか |
|---|---|
| `startReproducible` | `verifySlsaLevel` を **8 項目すべて `true`** で 1 回 |
| `startAttestation` | 上に加えて `matchReproducibleBuild` を `sha256:seed-a` 対 `sha256:seed-a` で 1 回 |

`src/adapters/mock.ts` の注釈は これを `a mock-only shortcut` と書いている。

**この shortcut は 2 つの保証を消す。** 実測した 2 例。

| 実測 | 結果 |
|---|---|
| `startReproducible` の直後に `match-build` を投げる (等級判定を 1 度もしていない) | `{ok: true, matched: true}` |
| `startAttestation` の直後に `sign-provenance` を投げる (照合を 1 度もしていない) | `{ok: true}` |

つまり `/reproducible` は **等級を確かめないまま「再現した」 と報告でき**、
`/attestation` は **照合を確かめないまま署名できる**。 直線が保証していた順序は、
session を分けた時点で route からは効かなくなっている。

**種として入る等級は 4 ではなく 3 になる。** bootstrap は `buildParameterizable: true` を渡すため、
後述の階段で最上段に届かない。 実測で `verifiedLevel` は `3` だった。
この値を返す route は無いので、HTTP からは種の等級を確かめられない。

### 各 route は session ごとに 1 度しか成功しない

直線を進むので、同じ session への 2 度目は必ず落ちる。 **落ちた時の文言が事実と食い違う。**

| 2 度目の呼出 | `errorKind` | 実際の状況 |
|---|---|---|
| `/supply-chain` の `verify-slsa-level` | `verifySlsaLevel: session is slsa-verified` | 正しい |
| **`/reproducible` の `match-build`** | **`matchReproducibleBuild: SLSA level must be verified first`** | 等級は bootstrap が確かめ済 |
| **`/attestation` の `sign-provenance`** | **`signProvenance: reproducible build must be matched first`** | 照合は bootstrap が済ませている |
| **`/attestation` の `verify-attestation`** | **`verifyAttestation: provenance must be signed first`** | 署名は 1 度目で済んでいる |

太字の 3 行は「まだやっていない」 と言うが、実際には **済んでいる**。
本当の原因は状態が先へ進んでいることの方になる。
同じ形が `dogfood-security-siem-incident-app` の `seal` / `retention` / `correlate` にもある。

### `errorKind` に 2 種類の語彙が混ざる

同じ field に、機械向けの短い符号と人間向けの英文が混在する。

| 出どころ | 形 | 実測値 |
|---|---|---|
| route validator | 符号 | `sessionId_required` / `slsaLevel_must_be_0_to_4` |
| adapter の session 検査 | 符号 | `slsa_session_not_found` / `attestation_session_not_found` |
| **adapter の順序検査** | **符号** | `provenance_not_signed` |
| **semantics の状態機械** | **英文** | `verifySlsaLevel: session is slsa-verified` |

**順序の検査が 2 層にあり、層ごとに語彙が違う。** `verify-attestation` を署名前に投げると、
adapter の `provenanceReady` が先に見て `provenance_not_signed` (符号) を返す。
一方 2 度目の `verify-attestation` は adapter を通り抜けて semantics に届き、
`verifyAttestation: provenance must be signed first` (英文) になる。
**同じ「署名が先」 という制約が、状況によって別の文字列で報告される。**

### 等級の階段

8 つの真偽値から 0 - 4 を決める。 段は積み上げ式で、下の段に届かなければ上は判定しない。
実測した 10 通り。

| 入力 (他はすべて `true`、`buildParameterizable` のみ既定 `false`) | 等級 |
|---|---|
| すべて満たす | **4** |
| **`buildParameterizable: true`** | **3** |
| `buildIsolated: false` | 2 |
| `provenanceNonFalsifiable: false` | 2 |
| `buildServiceIsTrustworthy: false` | 1 |
| `provenanceAuthenticated: false` | 1 |
| `provenanceServiceGenerated: false` | 1 |
| `buildScriptedFromRepo: false` | 0 |
| `provenanceExists: false` | 0 |
| 8 項目すべて `false` | 0 |

**`buildParameterizable` だけ意味が反転している。** 他の 7 項目は `true` が良い状態を表すのに、
この 1 項目は **`false` でなければ最上段に届かない**。 名前からは読み取れない。

段の境目ごとに要る項目の数は揃っていない。 1 段目は `buildScriptedFromRepo` と
`provenanceExists` の 2 つ、2 段目は `buildServiceIsTrustworthy` と `provenanceAuthenticated` と
`provenanceServiceGenerated` の 3 つ、3 段目は `buildIsolated` と `provenanceNonFalsifiable` の 2 つ、
4 段目は `buildParameterizable` の 1 つが要る。 いずれも組の全項目を満たさないと次の段へ進まない。

route validator は 8 項目すべてに真偽値を要求し、1 つでも欠けると
`{key}_required_boolean` になる。 実測で、8 項目を全部落とすと最初の
`buildScriptedFromRepo_required_boolean` が返った。

### 照合は文字列がそのまま等しいかだけを見る

`matched` は `buildA_hash === buildB_hash` で決まる。 実測した 4 通り。

| 入力 | `matched` |
|---|---|
| `sha256:x` と `sha256:x` | `true` |
| `sha256:aaa` と `sha256:bbb` | `false` |
| **`sha256:ABC` と `sha256:abc`** | **`false`**。 大小を区別する |
| **`hello` と `hello`** | **`true`**。 hash の形をしていなくても通る |

**値が hash であることは検査されない。** 同じ文字列でありさえすれば「再現した」 と報告される。

`toolchainVersion` は必須だが判定に効かない。 実測で `!!!` を渡しても
同じ hash なら `matched: true` になり、値は応答に写されるだけになる。

**照合が一致しなくても `ok: true` になる。** 実測で不一致は
`{ok: true, kind: 'match-build', matched: false}` を返した。 結果は `matched` にしか出ない。

### 署名と検証は値を写すだけ

`sign-provenance` は `builderId` / `materialsCount` / `signatureAlgorithm` を受け取り、
そのまま応答に返す。 実測した性質。

| 実測 | 結果 |
|---|---|
| `signatureAlgorithm` を `sigstore-cosign` / `in-toto` / `gpg` の 3 通りで送る | 応答の差は echo した値だけ。 挙動は変わらない |
| **`materialsCount: 0`** | **`{ok: true}`**。 材料 0 件の由来に署名できる |
| `materialsCount: -1` | `materialsCount_required_non_negative_number` |
| `builderId: ''` | `builderId_required` |

`verify-attestation` も同じ形になる。

| 実測 | 結果 |
|---|---|
| **`trustRootFingerprint: 'not-a-real-root'`** | **`{ok: true}`**。 信頼の起点は照合されない |
| `validSignatures: 0` | `validSignatures_must_be_at_least_1` |
| `attestationType` が 3 種以外 | `attestationType_must_be_slsa_spdx_or_cyclonedx` |

**署名も検証も暗号処理をしない。** 空でない文字列と 1 以上の数であることを確かめ、
その値を応答に写すだけになる。 `validSignatures` の下限は route validator と semantics の
両方にあり、semantics 側は route を通った入力では届かない。

### 出荷判断は 4 つの申告をそのまま信じる

`/sc-orchestrator` の `policyPassed` は、呼出側が申告した 4 値と 2 つの条件だけで決まる。
**他 3 route の結果を参照しない。** 実測した 8 通り。

| 入力 (基準は 等級 4 / 照合 `true` / 署名 `true` / 検証 `true` / 下限 3 / 検証必須 `true`) | `policyPassed` |
|---|---|
| 基準どおり | `true` |
| 等級 1 (下限 3 未満) | `false` |
| **等級 3 (下限 3 と同値)** | **`true`**。 判定は `<` で、同値は通る |
| 照合 `false` | `false` |
| 署名 `false` | `false` |
| 検証 `false` + 検証必須 `true` | `false` |
| **検証 `false` + 検証必須 `false`** | **`true`**。 必須を下ろすと未検証でも通る |
| 等級 0 + 下限 1 | `false` |

`slsaLevel` は 0 - 4 を受けるが `minRequiredLevel` は 1 - 4 のみで、
`0` は `minRequiredLevel_must_be_1_to_4` になる。 **下限を 0 に下げて全通しにはできない。**

**`/sc-orchestrator` に状態機械は無い。** 同じ session へ何度でも `decide` を投げられる。
他 3 route が 1 度しか成功しないのと対照的になる。

`closeOrchestrator` は `closed` を立てた直後に session を Map から削除する。
そのため `orchestrator_session_closed` は返らず、実測では常に
`orchestrator_session_not_found` が先に出た。 **到達しない分岐が 1 つ残っている。**
同じ死んだ分岐が `dogfood-security-siem-incident-app` にもある。

## 主な品質リスク

- **bootstrap が前段を偽の入力で走らせる**。 `/reproducible` は等級を確かめないまま照合でき、
  `/attestation` は照合を確かめないまま署名できる。 semantics が持っていた順序の保証が
  session を分けた時点で route からは効かない
- **種として入る等級が 3 で、HTTP から確かめられない**。 `buildParameterizable: true` で seed するため
  最上段に届かず、その値を返す route も無い
- **2 度目の呼出の文言が事実と食い違う**。 「まだやっていない」 と報告される 3 つの前段は、
  いずれも bootstrap か 1 度目の呼出で済んでいる
- **順序の検査が 2 層にあり語彙が違う**。 同じ「署名が先」 の制約が、状況によって
  `provenance_not_signed` (符号) と `verifyAttestation: provenance must be signed first` (英文) に割れる
- **`buildParameterizable` だけ意味が反転している**。 他 7 項目と逆に `false` が良い状態を表すため、
  真偽値の取り違えが等級を 4 から 3 へ静かに落とす
- **照合が hash の形を確かめない**。 同じ文字列でありさえすれば `matched: true` になり、
  `hello` 対 `hello` も再現とみなされる
- **`toolchainVersion` が判定に効かない**。 必須なのに応答へ写されるだけで、
  異なる toolchain の build を同一とみなすことを妨げない
- **署名も検証も暗号処理をしない**。 `trustRootFingerprint` は照合されず、
  `signatureAlgorithm` は 3 値のどれを選んでも挙動が変わらない
- **材料 0 件の由来に署名できる**。 `materialsCount: 0` が受理されるため、
  何も含まない由来が署名済として下流へ流れる
- **出荷判断が 4 つの申告を検証しない**。 `policyPassed` は呼出側が渡した値だけで決まり、
  他 3 route の結果とも、それを支える session とも突き合わせない
- **`requireAttestation: false` が検証を素通しさせる**。 未検証の証明でも `policyPassed: true` になる
- **`orchestrator_session_closed` に到達できない**。 close が session を削除するため、
  常に `not_found` が先に出る

## 推奨テスト構成

`startNextServer({ adapter })` が 4 route を node server に載せ、空き port で listen する。
`makeMockAdapter({ latencyMs: 0 })` を呼出側が作って渡すため、server と adapter の寿命は分けられる。

**この example は bootstrap を 4 回持つ。** 4 route のどれにも session を作る kind が無いため、
`adapter.startSlsa` / `startReproducible` / `startAttestation` / `startOrchestrator` を
直接呼んでから route を叩く。 `target` (`opa` / `vault`) も adapter 呼出でしか渡せない。

session は id ごとに 1 度しか進めず、`/supply-chain` と `/reproducible` と `/attestation` は
同じ id で 2 度回せない。 **test を分ける時は id も分ける。**
adapter の `closeSlsa` / `closeReproducible` / `closeAttestation` は session を消すので、
消してから作り直せば同じ id を再利用できる。

`page.request.post` は BrowserContext と cookie jar を共有するが、browser の navigation / renderer /
同一 origin 制約 / Service Worker は通らない。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 等級の判定 | `level` |
| 2 | 再現可能な build の照合 | `matched` / `toolchainVersion` |
| 3 | 由来の署名と証明の検証 | `builderId` / `attestationType` / `validSignatures` |
| 4 | 束ねた出荷判断 | `policyPassed` / `slsaLevel` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 等級 / 照合 / 署名と検証 / 出荷判断が 1 つの `APIRequestContext` から連続で通る | mock adapter を載せた server と Chromium BrowserContext に紐づく `page.request`、`startSlsa` / `startReproducible` / `startAttestation` / `startOrchestrator` で作った 4 session | `/supply-chain` (`verify-slsa-level` を 8 項目すべて満たす入力で) → `/reproducible` (`match-build` を同一 hash で) → `/attestation` (`sign-provenance` → `verify-attestation`) → `/sc-orchestrator` (`decide` を等級 4 と等級 1 で 2 回) を順に投げる | 等級は `status===200` で `{ok: true, level: 4}`。 照合は `{ok: true, matched: true, toolchainVersion: 'rust-1.80.0'}`。 署名は `{ok: true, builderId: 'github-actions://actions/runner@v2.317.0'}`。 検証は `{ok: true, attestationType: 'slsa-provenance', validSignatures: 2}`。 出荷判断は等級 4 で `{policyPassed: true, slsaLevel: 4}`、等級 1 で `{policyPassed: false, slsaLevel: 1}` | P0 | yes | node | `/supply-chain` `/reproducible` `/attestation` `/sc-orchestrator` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-security-supply-chain-slsa-app/tests/e2e/`
- 見つけた既存 test — 1 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 SLSA level verify + reproducible match + provenance sign + attestation verify + orchestrator decide end to end` (`examples/dogfood-security-supply-chain-slsa-app/tests/e2e/supply-chain-slsa-flow.spec.ts:46`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 4 route を 1 つの `APIRequestContext` から順に実行する happy path

T-E2E-001 は 6 手を 1 件に畳んである。 分けないのは `/attestation` の 2 手が順序を持ち、
4 route が 1 つの出荷判断へ集まる形を 1 本で見せるため。

**`status===200` の assert だけでは domain の成否を判別できない。** JSON parse や dispatch 自体の
失敗は 400 / 500 になるが、route validator と route handler が返す失敗は 200 なので、
domain の成否を判別しているのは `toMatchObject({ok: true, ...})` の方になる。

**この test は出荷判断が他 3 route を見ていないことを、意図せず示している。**
`/sc-orchestrator` へ 2 度目に渡す `slsaLevel: 1` は、直前の `/supply-chain` が返した `level: 4` と
食い違うのに、誰も食い違いを検出しない。 `policyPassed: false` は申告した `1` から出た結果になる。

**等級 4 を確かめているのは `/supply-chain` の session だけになる。** `/reproducible` と
`/attestation` を支える 2 session は bootstrap が等級 3 で seed しており、
この test はそちらの等級を 1 度も確かめていない。

**この 1 件が覆っていない範囲**。 到達可否は表のとおり。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| 等級の階段の 10 通りと `buildParameterizable` の反転 | できる | 最上段の 1 通りしか送っていない |
| 8 項目のいずれかを落とした時の `{key}_required_boolean` | できる | 全項目を送っている |
| 2 度目の呼出の 4 種の英文 `errorKind` | できる | 各 route を 1 度ずつしか送っていない |
| bootstrap が前段を seed していること | できる | 前段を 1 度も飛ばしていない |
| bootstrap が seed する等級が 3 であること | **できない** | 種の等級を返す route が無い |
| `matched: false` が `ok: true` で返ること | できる | 同一 hash だけを送っている |
| hash の形をしていない文字列が照合を通ること | できる | `sha256:` 形式だけを送っている |
| 大小の違いで照合が外れること | できる | 完全に同じ文字列を送っている |
| `toolchainVersion` が判定に効かないこと | できる | 1 通りしか送っていない |
| `provenance_not_signed` (署名前の検証) | できる | 署名を先に送っている |
| `signatureAlgorithm` の 3 値で挙動が変わらないこと | できる | `sigstore-cosign` だけを送っている |
| `materialsCount: 0` が受理されること | できる | `5` を送っている |
| `trustRootFingerprint` が照合されないこと | できる | それらしい値を 1 通り送っている |
| 出荷判断の 8 通りと、下限と同値が通る境界 | 一部できる | 等級 4 と 1 の 2 通りだけを送っている |
| `requireAttestation: false` が未検証を通すこと | できる | `true` だけを送っている |
| `minRequiredLevel: 0` が拒まれること | できる | `3` を送っている |
| `decide` を同じ session へ繰り返せること | できる | 2 回送っているが、繰り返せること自体は assert していない |
| `close` 系 3 種と、消してからの作り直し | できる | 呼んでいない |
| `*_session_exists` の 4 種 | できる | 各 id を 1 回だけ開始している |
| `*_session_not_found` の 4 種 | できる | 先に session を作っている |
| `orchestrator_session_closed` | **できない** | close が session を削除するため `not_found` が先に出る |
| route validator が返す各 `ok: false` | できる | 正常な入力だけを送っている |
| 未知の path の 404 と POST 以外の 405 | できる | 正常な path と method だけを送っている |
| 壊れた JSON の 400 | できる | Playwright の `data` で正しい JSON だけを送っている |
| `dispatch_failed` の 500 | 通常入力ではできない | dispatch が例外を投げた時だけの防御経路 |
| adapter が記録する trace | HTTP からはできない | trace を返す route が無く、`traces()` を直接読む必要がある |
| `target` の指定 (`opa` / `vault`) | HTTP からはできない | adapter 呼出でしか渡せない |

到達できない 5 つは性質が 3 つに分かれる。 `orchestrator_session_closed` は
**実装上どの入力でも到達しない** 死んだ分岐、種の等級は **値を返す route が無い**、
残り 3 つは HTTP の口が無いか防御用の経路になる。
**HTTP の口の数と、その下にある route / adapter / semantics の分岐の数は別になる。**
本 example では route が 4 つに増えた分、下の直線 1 本との対応がさらに離れている。

## 手動確認でよいテスト

(なし)

## 不足している仕様

(なし)
