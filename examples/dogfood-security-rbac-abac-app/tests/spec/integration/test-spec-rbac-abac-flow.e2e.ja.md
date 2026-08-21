# test-spec-rbac-abac-flow (e2e-generic layer)

役割による認可 (RBAC) / 属性による認可 (ABAC) / 方針の版管理の 3 経路を、
実 Chromium から順に叩いて確かめる。

画面は描画しない。 `src/lib/next-server.ts` が 3 route を node server に載せ、
Playwright の `page.request` が JSON を投げる。

- module: rbac-abac-flow
- layer: e2e-generic

## 対象機能

| 経路 | kind | 実体 |
|---|---|---|
| `POST /rbac` | `attach` / `check` | `src/app/rbac/route.ts` → `src/adapters/mock.ts` |
| `POST /abac` | `attach` / `evaluate` | `src/app/abac/route.ts` → 同上 |
| `POST /policy-store` | `publish` / `rollback` | `src/app/policy-store/route.ts` → 同上 |

## 仕様の要約

### 方針の作成は HTTP から到達できない

3 つの方針 (`startRbac` / `startAbac` / `startPolicyStore`) はどの route にも生えていない。
e2e は **adapter を直接呼んで**用意する。

```ts
await adapter.startRbac({ policyId: 'e2e-rbac' });
await adapter.startAbac({ policyId: 'e2e-abac', algorithm: 'deny-overrides' });
await adapter.startPolicyStore({ policyId: 'e2e-store' });
```

**`algorithm: 'deny-overrides'` もここでしか指定できない。** ABAC の結合規則は
HTTP から選べず、e2e が 1 通りだけを固定している。

### 検証の失敗も 200 で返る

status で成否を判別できない。 使うのは dispatcher の 2 種だけ
(未知の path が 404 / `route_not_found`、POST 以外が 405 / `method_not_allowed`)。

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

`reason` は一致しない時 `abac: no rule matched`、両方一致した時
`abac: deny-overrides ...` になる。 **`matchedRule` が `null` かどうかで
「規則が無い」 と「拒否された」 を見分けられる。**

### 版管理は連番と有効版を分ける

| 呼出 | `version` | `activeVersion` |
|---|---|---|
| `publish` (`activateOnPublish: true`) | 1 | 1 |
| `publish` (`activateOnPublish: true`) | 2 | 2 |
| `rollback` (`toVersion: 1`) | — | 1 (`rolledBackFrom: 2` / `rolledBackTo: 1`) |
| `publish` (**`activateOnPublish: false`**) | 2 | **1 のまま** |

`version` は publish のたびに増え、`activeVersion` は `activateOnPublish` が真の時だけ追従する。

| 失敗 | 結果 |
|---|---|
| 存在しない版へ `rollback` | `{ok: false, errorKind: 'store_version_missing'}` |
| publish なしで `rollback` | 同じ `store_version_missing` |

**2 つが同じ `errorKind` になる。** 「版が足りない」 と「1 つも無い」 を区別できない。

## 主な品質リスク

- **拒否と設定漏れが同じ応答になる**。 RBAC は role を 1 つも attach していなくても
  `ok: true` / `allowed: false` を返す。 認可を落としたのか、設定を忘れたのかが分からない
- **ABAC の結合規則が HTTP から選べない**。 `deny-overrides` は `startAbac` の引数で、
  route には無い。 `permit-overrides` 等に切り替えた時の挙動を e2e が 1 度も通らない
- **status が成否を表さない**。 検証失敗も 200
- **`store_version_missing` が 2 つの状況を兼ねる**。 版が足りない場合と 1 つも無い場合が
  同じ `errorKind` になる
- **`activateOnPublish: false` の版が残る**。 `version` は増えるが `activeVersion` は動かないため、
  有効でない版が蓄積する。 消す経路が route に無い
- **方針の作成が HTTP に無い**。 e2e が adapter を直接呼ぶため、
  実際の deploy でどう方針が作られるかを 1 度も通していない

## 推奨テスト構成

`startNextServer({ adapter })` が 3 route を node server に載せる。
`makeMockAdapter({ latencyMs: 0 })` を呼出側が作って渡す。

**3 つの bootstrap を忘れると経路が動かない。** `startAbac` の `algorithm` は
ここでしか指定できない。

RBAC は attach の順序が結果に効く (`parents` の解決に必要)。
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
| T-E2E-001 | RBAC の継承 + ABAC の評価 + 版の巻き戻しが 1 つの page から連続で通る | mock adapter を載せた server、Chromium の page、**adapter を直接呼んで作った 3 方針** (ABAC は `deny-overrides`) | `/rbac` に `viewer` と `parents: ['viewer']` を持つ `editor` を attach し `editor` で `post:read` を check、`/abac` に `permit` 規則を attach し一致する属性で evaluate、`/policy-store` に 2 回 publish して version 1 へ rollback | すべて `status===200`。 RBAC は `{ok: true, kind: 'check', allowed: true}`。 ABAC は `{ok: true, kind: 'evaluate', effect: 'permit', matchedRule: 'r-permit'}`。 版管理は 1 回目が `{version: 1, activeVersion: 1}`、2 回目が `{version: 2, activeVersion: 2}`、rollback が `{rolledBackFrom: 2, rolledBackTo: 1, activeVersion: 1}` | P0 | yes | node | `/rbac` `/abac` `/policy-store` |

## 自動化方針

1 件で 3 route / 8 呼出を畳んである。 分けないのは RBAC の継承と版管理の巻き戻しが
どちらも前段の呼出を前提にするため。

**`status===200` の assert は空振りになる。** route へ到達すれば必ず 200 が返る。

assert は値を固定してある (`allowed: true` / `matchedRule: 'r-permit'` /
`version` と `activeVersion` の 3 組)。 範囲ではない。

**この 1 件が覆っていない範囲**。 いずれも同じ経路から到達できる。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| RBAC の `allowed: false` (3 通り) | できる | 許可される形だけを送っている |
| **role を attach せずに check した時も `ok: true` になること** | できる | 必ず attach してから問う |
| ABAC の `deny` (3 通り) | できる | 一致する形だけを送っている |
| ABAC で `permit` と `deny` が両方一致した時の `deny-overrides` | できる | `permit` だけを attach している |
| **規則を attach せずに evaluate した時の既定拒否** | できる | 必ず attach してから評価する |
| `activateOnPublish: false` で `activeVersion` が動かないこと | できる | `true` だけを送っている |
| `store_version_missing` の 2 通り | できる | 存在する版へ巻き戻している |
| dispatcher の 404 / 405 | できる | 既知の 3 path へ POST だけを送っている |
| ABAC の `deny-overrides` 以外の結合規則 | **できない** | `startAbac` の引数で、route から選べない |

最後の 1 行だけが到達できない。 **方針の作成そのものが HTTP に無い**ためで、
結合規則を切り替える経路は単体テストが `startAbac` を直接呼んで確かめる。
