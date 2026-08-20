# test-spec-v1-legacy-flow (e2e-generic layer)

テナント分離の 4 経路 (注入 / 越境拒否 / 例外の監査 / 監査鎖の検証) を、
同じ adapter に順に投げて確かめる。

UI は無い。 `tests/e2e/fixture.ts` が mock adapter を JSON の口として node server に載せ、
browser の `fetch` がそこを叩く。 `page.goto(origin)` で同じ origin に置いてから投げる。

- module: v1-legacy-flow
- layer: e2e-generic

## 対象機能

| 経路 | adapter の op | 実体 |
|---|---|---|
| `/tenant-injection` | `driveTenantInjection` | `src/adapters/mock.ts` + `src/tenant/index.ts` + `src/rls/index.ts` + `src/audit/index.ts` |
| `/cross-tenant-refuse` | `driveCrossTenantRefuse` | `src/adapters/mock.ts` + `src/tenant/index.ts` + `src/rls/index.ts` + `src/audit/index.ts` |
| `/bypass-audit` | `driveBypassAudit` | `src/adapters/mock.ts` + `src/rls/index.ts` + `src/audit/index.ts` |
| `/audit-integrity` | `driveAuditIntegrity` | `src/adapters/mock.ts` + `src/audit/index.ts` |

## 仕様の要約

### 注入は書込が 0 件でも方針を入れる

まっさらな server で実測した。

| 入力 | `writes` | `injectedTenantIds` | `policyInstalled` |
|---|---|---|---|
| 組織 2 件 | 2 | `['t-a','t-b']` | `true` |
| 空配列 | 0 | `[]` | **`true`** |
| 既定 (未指定) | 0 | `[]` | **`true`** |

**`policyInstalled` は書込の有無を見ない。** 0 件でも真になるため、
「方針が入った」 を「何かを書いた」 と読むと空の呼出を成功と誤認する。

### 越境拒否は異なるテナントを要求する

| 入力 | 結果 |
|---|---|
| `intruderTenantId` が呼出側と違う | 200 / `ownReads: 1`、`refusals: 1`、`refusalKind: 'CROSS_TENANT_REFUSED'` |
| `intruderTenantId` が呼出側と同じ | **500** `tryCrossTenantRead: caller passed the same tenantId — cross-tenant test requires different ids` |

同じ id を渡すと「越境」 が成立しないため、実装が先に拒む。

### 例外の監査は操作数 + 3 件を記録する

| 入力 | `bypassOps` | `auditEntriesAppended` |
|---|---|---|
| 操作 1 件 | 1 | **4** |
| 操作 2 件 | 2 | **5** |
| 操作 3 件 | 3 | **6** |
| 操作 0 件 | 0 | **3** |

まっさらな adapter では、これは 2 点からの外挿ではなく、実装から
`input.ops.length + 3` と導ける。
`withBypass()` が開始と終了の 2 件、callback が各操作を 1 件ずつ追加し、
終了後の `g.assertRead()` が方針強制済みの read を 1 件追加するため。
`reArmedAfterBypass` は両方とも真で、例外の後に方針が戻ることを表す。

ただしこの式は **呼出前に `g.session.auditLog` の未 drain entry が無い場合**に限る。
同じ adapter で先に組織 1 件を含む「同じ id」の越境を 500 にすると、例外前の
write / own-read が session に残る。その後に操作 1 件の `/bypass-audit` を呼ぶと、
それらも最初の `drainSessionAudit()` が回収するため
`auditEntriesAppended: 6` になる。

### 監査鎖の検証は 2 つとも**落ちようがない**

**この仕様書で最も重要な性質。**

`driveAuditIntegrity` は log が空なら合成 record を 1 件植える。

```ts
if (log.size() === 0) {
  const g = ensureGate();
  g.assertRead('tenant-seed');
  drainSessionAudit(g.session, log);
}
```

そのため **`totalRecords` は前段が何もしなくても 1 以上になる**。
まっさらな server で `/audit-integrity` だけを呼ぶと `totalRecords: 1` が返る。

さらに `tamperAtIndex` を渡しても `chainOk` は真のままになる。
`src/adapters/mock.ts` は 2 回の reset + rebuild を行う。1 回目で逆順にした
`chainHash` は、`append()` に `{tenantId, operation, allowed, reason}` の 4 field しか
渡さないため捨てられる。2 回目は対象 record の `reason` に `::TAMPERED` を
追加するが、その内容から `append()` が全 hash を再計算する。
したがって record の内容は変わるが、保存後の鎖は自己整合した状態になる。
また HTTP から呼べる他の経路も record の追加に `append()` を使い、
保存済み hash を直接変更する口は無い。

実測で確かめた。 record を 6 件まで増やし、`tamperAtIndex` を 0 / 1 / 2 / 3 / -1 の
5 通りで試して **すべて `chainOk: true` / `brokenAt: -1`** だった。

| 主張 | 落ちる条件 |
|---|---|
| `totalRecords > 0` | **HTTP 経路には無い** (空なら合成 record を追加する) |
| `chainOk === true` | **HTTP 経路には無い** (改竄後の record も `append()` が hash を再計算する) |

## 主な品質リスク

- **監査鎖の 2 つの assert が落ちようがない**。 `totalRecords > 0` は合成 record が、
  `chainOk === true` は改竄後の再 hash で鎖が自己整合することが保証する。
  **前段の 3 経路が何も記録しなくても通る**ため、
  この 2 つは記録の蓄積を検証していない
- **改竄の模擬が働いていない**。 `tamperAtIndex` は入力として受け取るが、
  対象の `reason` は変わるものの、`append()` が hash を再計算するため
  `chainOk` / `brokenAt` に効果が出ない。改竄検知の失敗経路は検証されない
- **`policyInstalled` が書込の有無を区別しない**。 0 件でも真
- **越境拒否が「同じ id」 を 500 で拒む**。この拒否自体を示す監査 entry は
  追加されない。一方、失敗 trace は `timed()` が追加し、例外前の write / own-read の
  監査 entry は session に残る。次の `/bypass-audit` がそれらを回収するため、
  `auditEntriesAppended` の「操作数 + 3」を同じ server の後続呼出では保てない
- **`auditEntriesAppended` の基底 3 件の内訳が応答から読めない**。 操作数との差でしか分からず、
  内訳が変わっても検出できない

## 推奨テスト構成

`bootAdapterServer()` が mock adapter を 1 つ作り、port 0 で listen する。
**adapter は server ごと**で、`browser.newContext()` の単位ではない。

`page.goto(origin)` を先に呼ぶ (`about:blank` からだと CORS の事前確認で落ちる)。

**4 経路は監査 log を共有する。** `/tenant-injection` / `/cross-tenant-refuse` /
`/bypass-audit` がそれぞれ記録を足し、`/audit-integrity` がそれを数える。
ただし後者は空でも合成 record を植えるため、
**共有していることを `totalRecords` からは確かめられない**。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 注入の書込数と方針 | `writes` / `policyInstalled` |
| 2 | 越境の拒否 | `refusals` / `refusalKind` |
| 3 | 例外の記録と復帰 | `bypassOps` / `reArmedAfterBypass` |
| 4 | 監査鎖の状態 | `chainOk` / `totalRecords` |
| 5 | 4 経路の連結 | 同じ page から順に投げて全部通る |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | v1 の 4 経路が 1 つの page から連続で通る | mock adapter を載せた server と、その origin に置いた page | `/tenant-injection` (組織 2 件) → `/cross-tenant-refuse` (`t-a` から `t-b` へ) → `/bypass-audit` (操作 1 件) → `/audit-integrity` を順に `fetch` | 注入は `writes===2`、`policyInstalled===true`。 越境は `refusals===1`、`refusalKind==='CROSS_TENANT_REFUSED'`。 例外は `bypassOps===1`、`reArmedAfterBypass===true`。 監査は `chainOk===true`、`totalRecords>0` | P0 | yes | node | `/tenant-injection` `/cross-tenant-refuse` `/bypass-audit` `/audit-integrity` |

## 自動化方針

1 件で 4 経路を通す。 分けないのは 4 つが同じ adapter の監査 log を共有するため。

**ただし監査の 2 つの assert は落ちようがない** (上記)。 この test が実際に検証しているのは
前 3 経路の 6 つの値までで、監査部分は「200 が返る」 以上を保証しない。

前 3 経路の assert は値を固定してある (`writes===2` / `refusals===1` / `bypassOps===1`)。
範囲ではないため、値が変われば落ちる。

**この 1 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `injectedTenantIds` の中身 | できる | 応答に含まれるが assert していない |
| 注入 0 件でも `policyInstalled` が真 | できる | 2 件を渡す形だけを送っている |
| 越境で同じ id を渡した時の 500 | できる | 異なる id だけを送っている |
| `ownReads` | できる | assert していない |
| `bypassOpened` | できる | 応答に含まれるが assert していない |
| fresh adapter での `auditEntriesAppended` (操作数 + 3) | できる | assert していない |
| 500 後の未 drain entry が次の `auditEntriesAppended` に混ざること | できる | 失敗経路の後に `/bypass-audit` を呼んでいない |
| 操作 2 件以上の `bypassOps` | できる | 1 件だけを送っている |
| `totalRecords` の具体値と前段 3 経路の増分 | できる | `> 0` でしか見ていない |
| `brokenAt === -1` | できる | 応答に含まれるが assert していない |
| metric への効き方 | できる | `/metrics` を読んでいない |
| trace の追加 | できる | `/traces` を読んでいない |
| `chainOk === false` / `brokenAt >= 0` | **できない** | 改竄後も hash を再計算するため、この route から不整合な鎖を作れない |

最後の 1 件だけがこの adapter の HTTP 経路から到達できない。
`tamperAtIndex` は対象 record の `reason` を変えるが、hash も再計算するため、
応答の `chainOk` / `brokenAt` を失敗側へ変えられない。
