# test-spec-rbac-abac-flow (e2e-generic layer)

役割による認可 (RBAC) / 属性による認可 (ABAC) / 方針の版管理の 3 経路を、Chromium の
BrowserContext に紐づく Playwright `APIRequestContext` から順に叩いて確かめる。

画面は描画しない。 `src/lib/next-server.ts` が 3 route を node server に載せ、
Playwright の `page.request` が JSON を投げる。これは `page.context().request` と同じ
API testing helper で、Chromium page 内の `fetch` ではない。

- module: rbac-abac-flow
- layer: e2e-generic

## 対象機能

| 経路 | kind | 実体 |
|---|---|---|
| `POST /rbac` | `attach` / `expand` / `check` | `src/app/rbac/route.ts` → `src/adapters/mock.ts` |
| `POST /abac` | `attach` / `evaluate` / `combined` | `src/app/abac/route.ts` → 同上 |
| `POST /policy-store` | `publish` / `activate` / `rollback` | `src/app/policy-store/route.ts` → 同上 |

## 仕様の要約

### 方針の作成と終了は HTTP から到達できない

3 つの方針の作成 (`startRbac` / `startAbac` / `startPolicyStore`) と終了
(`closeRbac` / `closeAbac` / `closePolicyStore`) はどの route にも生えていない。
e2e は作成だけを **adapter を直接呼んで**行い、終了は呼ばない。

```ts
await adapter.startRbac({ policyId: 'e2e-rbac' });
await adapter.startAbac({ policyId: 'e2e-abac', algorithm: 'deny-overrides' });
await adapter.startPolicyStore({ policyId: 'e2e-store' });
```

**`algorithm: 'deny-overrides'` もここでしか指定できない。** ABAC の結合規則は
HTTP から選べず、e2e が 1 通りだけを固定している。

### 検証の失敗も 200 で返る

route が返す domain の成否は status で判別できない。非 200 を設定するのは dispatcher で、
壊れた JSON が 400 / `body_parse_failed`、未知の path が 404 / `route_not_found`、
POST 以外が 405 / `method_not_allowed`、dispatch が応答 object を返さず例外を投げた時が
500 / `dispatch_failed` になる。

### RBAC は「拒否」 をエラーにしない

実測した 4 通り。 **すべて `ok: true`** で返る。

| 状況 | `allowed` |
|---|---|
| `editor` が `parents: ['viewer']` を持ち、`viewer` の権限を問う | `true` |
| `editor` が `parents` を持たず、`viewer` の権限を問う | `false` |
| 未知の role で問う | `false` |
| **role を 1 つも attach せずに問う** | `false` |

最後の 2 行が要点になる。 **役割が存在しないことと、権限が無いことが同じ応答になる。**
呼出側は「設定の誤り」 と「正しく拒否された」 を区別できない。

### ABAC は既定が拒否

`deny-overrides` で実測した 4 通り。 **すべて `ok: true`**。

| 状況 | `effect` | `matchedRule` |
|---|---|---|
| `permit` の規則が属性に一致 | `permit` | `r-permit` |
| 属性が一致しない | `deny` | `null` |
| `permit` と `deny` の両方が一致 | **`deny`** | `r-deny` |
| **規則を 1 つも attach していない** | `deny` | `null` |

規則が 1 件も無い時も、規則はあるが属性に一致しない時も、`reason` は
`abac: no rule matched (default deny)` になる。両方一致した時は `abac: deny-overrides ...`。
`matchedRule` が規則 id なら一致した規則による判断、`null` なら一致する規則が無かったことを示す。
空の方針と規則不一致は応答から区別できない。

### 版管理は連番と有効版を分ける

| 呼出 | `version` | `activeVersion` |
|---|---|---|
| `publish` (`activateOnPublish: true`) | 1 | 1 |
| `publish` (`activateOnPublish: true`) | 2 | 2 |
| `rollback` (`toVersion: 1`) | — | 1 (`rolledBackFrom: 2` / `rolledBackTo: 1`) |
| `publish` (**`activateOnPublish: false`**) | 2 | **1 のまま** |

上 3 行は 1 つの case、最後の行は fresh server で version 1 を有効化した後に非有効 publish した
別 case の観測になる。

`version` は publish のたびに増え、`activeVersion` は `activateOnPublish` が真の時だけ追従する。

| 失敗 | 結果 |
|---|---|
| 存在しない版へ `rollback` | `{ok: false, errorKind: 'store_version_missing'}` |
| publish なしで `rollback` | 同じ `store_version_missing` |

**2 つが同じ `errorKind` になる。** 「版が足りない」 と「1 つも無い」 を区別できない。

## 主な品質リスク

- **保護対象への強制を通らない**。`page.request` で decision JSON を読むだけなので、deny 時に
  実 resource へのアクセスが遮断されることは検証しない
- **拒否と設定漏れが同じ応答になる**。 RBAC は role を 1 つも attach していなくても
  `ok: true` / `allowed: false` を返す。 認可を落としたのか、設定を忘れたのかが分からない
- **ABAC の結合規則が HTTP から選べない**。 `deny-overrides` は `startAbac` の引数で、
  route には無い。 `permit-overrides` 等に切り替えた時の挙動を e2e が 1 度も通らない
- **ABAC の規則なしと不一致が同じ応答になる**。どちらも `effect: 'deny'` /
  `matchedRule: null` / `reason: 'abac: no rule matched (default deny)'` になる
- **status が domain の成否を表さない**。 route validator の失敗も、handler が捕捉した状態不整合も 200
- **`store_version_missing` が 2 つの状況を兼ねる**。 版が足りない場合と 1 つも無い場合が
  同じ `errorKind` になる
- **`activateOnPublish: false` の版も履歴に残る**。 `version` は増えるが `activeVersion` は動かず、
  保持期間や削除を指定する経路は route に無い
- **方針の作成と終了が HTTP に無い**。 e2e は作成を adapter 直呼びで迂回し、終了を呼ばないため、
  HTTP の外にある lifecycle の配線は検証しない

## 推奨テスト構成

`startNextServer({ adapter })` が 3 route を node server に載せる。
`makeMockAdapter({ latencyMs: 0 })` を呼出側が作って渡す。

**3 つの bootstrap を忘れると経路が動かない。** `startAbac` の `algorithm` は
ここでしか指定できない。

RBAC は親子 role が check より前に揃うことが結果に効くが、親と子の attach 順自体は問わない。
版管理も publish の回数が `version` に効く。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 役割の継承 | `allowed` |
| 2 | 属性の評価 | `effect` / `matchedRule` |
| 3 | 版の発行と巻き戻し | `version` / `activeVersion` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | RBAC の継承 + ABAC の評価 + 版の巻き戻しが 1 つの `APIRequestContext` から連続で通る | mock adapter を載せた server、Chromium BrowserContext に紐づく `page.request`、**adapter を直接呼んで作った 3 方針** (ABAC は `deny-overrides`) | `/rbac` に `viewer` と `parents: ['viewer']` を持つ `editor` を attach し `editor` で `post:read` を check、`/abac` に `permit` 規則を attach し一致する属性で evaluate、`/policy-store` に 2 回 publish して version 1 へ rollback | すべて `status===200`。 RBAC は `{ok: true, kind: 'check', allowed: true}`。 ABAC は `{ok: true, kind: 'evaluate', effect: 'permit', matchedRule: 'r-permit'}`。 版管理は 1 回目が `{version: 1, activeVersion: 1}`、2 回目が `{version: 2, activeVersion: 2}`、rollback が `{rolledBackFrom: 2, rolledBackTo: 1, activeVersion: 1}` | P0 | yes | node | `/rbac` `/abac` `/policy-store` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-security-rbac-abac-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` / `.next` / `.turbo` / `dist` / `.vitest-dist` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 RBAC attach + check + ABAC evaluate + policy-store rollback end to end` (`examples/dogfood-security-rbac-abac-app/tests/e2e/rbac-abac-flow.spec.ts:42`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — `/rbac` に `viewer` と `parents: ['viewer']` を持つ `editor` を attach して `editor` で `post:read` を check し、`/abac` で `permit` を評価し、`/policy-store` で 2 版を publish してから巻き戻し、RBAC の継承 + ABAC の評価 + 版の巻き戻しが 1 つの `APIRequestContext` から連続で通ることを確かめる

1 件で 3 route / 8 呼出を畳んである。 分けないのは RBAC の継承と版管理の巻き戻しが
どちらも前段の呼出を前提にするため。

**`status===200` の assert だけでは domain の成否を判別できない。** JSON parse や dispatch 自体の
失敗は 400 / 500 になるが、route validator と route handler が返す失敗は 200 になる。

assert は値を固定してある (`allowed: true` / `matchedRule: 'r-permit'` /
`version` と `activeVersion` の 3 組)。 範囲ではない。

**この 1 件が覆っていない範囲**。 到達可否は表のとおり。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| RBAC の `allowed: false` (3 通り) | できる | 許可される形だけを送っている |
| **role を attach せずに check した時も `ok: true` になること** | できる | 必ず attach してから問う |
| RBAC の `expand` とその `permissions` / `rolesVisited` | できる | `attach` / `check` だけを呼んでいる |
| ABAC の `deny` (3 通り) | できる | 一致する形だけを送っている |
| ABAC で `permit` と `deny` が両方一致した時の `deny-overrides` | できる | `permit` だけを attach している |
| **規則を attach せずに evaluate した時の既定拒否** | できる | 必ず attach してから評価する |
| ABAC の `combined` (RBAC のみ / ABAC のみ / 両方) | できる | `attach` / `evaluate` だけを呼んでいる |
| `activateOnPublish: false` で `activeVersion` が動かないこと | できる | `true` だけを送っている |
| `/policy-store` の `activate` | できる | `publish` / `rollback` だけを呼んでいる |
| `store_version_missing` の 2 通り | できる | 存在する版へ巻き戻している |
| `rbac_role_duplicate` / `abac_rule_duplicate` / `store_rollback_not_backwards` | できる | 重複と前進方向の rollback を送っていない |
| RBAC / ABAC 応答の未 assert field (`policyId` / `subjectId` / ABAC の `reason`) | できる | 判断結果の主要 field だけを assert している |
| policy-store 応答の `kind` / `policyId` | できる | version pointer だけを assert している |
| bootstrap なしの `rbac_session_missing` / `abac_session_missing` / `store_session_missing` | できる | adapter を直接呼んで必ず bootstrap している |
| 3 route の必須 field / 型 / kind の検証失敗 | できる | 正しい形だけを送っている |
| dispatcher の 404 / 405 | できる | 既知の 3 path へ POST だけを送っている |
| 壊れた JSON の 400 | できる | Playwright の `data` で正しい JSON だけを送っている |
| `dispatch_failed` の 500 | 通常入力ではできない | dispatch が例外を投げた時だけの防御経路 |
| ABAC の `deny-overrides` 以外の結合規則 | **できない** | `startAbac` の引数で、route から選べない |
| 方針の作成 / 終了 | HTTP からはできない | `start*` / `close*` が route に無い |

route が公開する 3 つの未実行 kind (`expand` / `combined` / `activate`) は HTTP から到達できる。
一方、結合規則の選択と方針の作成 / 終了は HTTP から到達できず、防御用の 500 も通常入力では
選べない。結合規則を切り替える経路は単体テストが `startAbac` を直接呼んで確かめる。

## 手動確認でよいテスト

(なし)

## 不足している仕様

(なし)
