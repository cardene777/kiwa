---
title: "@kiwa/orm v0.6 transaction-orchestrator SSOT"
---

# @kiwa/orm v0.6 transaction-orchestrator SSOT

## What this covers

`@kiwa/orm` v0.6 transaction-orchestrator = txn-isolation + mvcc + connection-pool + logical-replication + partitioning の 5 axis を 継続合成する 上位 layer。 ORM pair v0.1 → v0.2 → v0.3 → v0.4 → v0.5 → v0.6 = 6 段深化到達 = **depth-5 pattern 9 例目 candidate = systematic law 継続強化 第 3 例**、 **backend systems layer 初適用**、 pattern 昇格階段 の 最上位 = kiwa 全体 で 必ず守る 最上位規範化、 systematic pattern 51 度目適用 (lifecycle-orchestrator variant ORM 転用)。

## 5 state SSOT

| state | 意味 |
|---|---|
| beginning | BEGIN transaction 発行中 |
| active | transaction active、 query 実行可能 |
| savepoint-nested | savepoint 作成中、 nested transaction 状態 |
| committing | COMMIT 発行中 |
| aborted | terminal (ROLLBACK or timeout) |

## 8 event SSOT

begin-completed / query-executed / savepoint-created / savepoint-released / commit-requested / commit-succeeded / rollback-requested / timeout

## 40 セル 遷移表 SSOT

5 state × 8 event = 40 セル。 T-O-TX-009 test で 網羅 assert。

## API SSOT

```ts
startTransaction(input: { timestamp: string }): TransactionSession;
dispatchTransactionEvent(input: { session; event; timestamp }): TransactionSession;
summarizeTransaction(session): TransactionSummary;
```

## throw guard (backend systems layer = 遷移確定的)

backend systems (ORM / Auth / Cache / Queue / cli-test) は 遷移確定的で 誤指定 = code bug、 invalid record + terminal 遷移禁止 の throw guard pattern を採用。 soft-reject は payment / realtime / streaming / webhook 重複配信 domain 限定 SOP を継承。

## Backward compat 絶対維持

- 既存 API (v0.1-v0.5) 変更 0
- shape 契約 preserving = 27 existing semantics + adapter 群 全て 触らず (Drizzle + Prisma + Kysely + Migrator + Prisma-testcontainers)
- 新規 file 追加のみ (`src/semantics/transaction-orchestrator.ts` + `tests/semantics/transaction-orchestrator.test.ts`)

## depth-5 pattern 9 例目 candidate = systematic law 継続強化 第 3 例 SSOT

**Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 + Payment v2.3 + Realtime v2.4 + Streaming v2.5 (systematic law CONFIRMED) + Search v2.6 + Observability v2.7 + ORM v2.8 = 9 pair 到達 candidate**、 backend systems layer 初適用の 記録 milestone、 systematic pattern 51 度目、 kiwa 全体 systematic law 完全普及に向けた継続深化 phase。
