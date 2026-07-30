---
name: kiwa-migration
description: |
  @kiwa-lab/migration (Prisma / Drizzle / Kysely / Knex 統一 mock harness) を使った DB migration test 生成 skill。
  `createMigrationClient` で provider mock を立て、 `runUp` / `runDown` で 1 migration の順逆実行、 `diffSchema` で prev → next の schema 差分抽出、 `applyPendingMigrations` で pending 全順次適用、 `listAppliedMigrations` で history 取得を verify できる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-migration — DB migration test 生成

`@kiwa-lab/migration` の 4 provider を表す in-process harness を使い、migration の履歴と投入前の判断を Vitest 形式で生成する。実 database への SQL 実行を生成する skill ではない。

## 目的

DB schema migration を「provider を差し替えても同じ up/down 挙動を担保する」 test で書く。 provider 別 migration API (Prisma migrate / Drizzle drizzle-kit / Kysely migrator / Knex migrate) を吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/migration` install 済
- Vitest 環境
- 対象 module に migration 定義または SQL 文字列が存在

## オプション

- `--module {name}` — test 対象 module
- `--provider {prisma|drizzle|kysely|knex}` — 主要 provider
- `--output {path}` — 生成 test path

## 実行フロー

### 適用と rollback を確認する test

`createMigrationClient({ provider })` で client を作り、`runUp(client, migration)` の後に `runDown(client, migration.id)` を呼ぶ。`listAppliedMigrations` で `applied` と `rolledBack` の両方を assert する。実 schema や database の状態が戻ることはこの harness だけでは証明できない。

### 複数 migration の順序を確認する test

`applyPendingMigrations(client, [m1, m2, m3])` の id 昇順適用と `listAppliedMigrations(client)` の履歴順を assert する。すでに適用済みの id は `skipped` へ入る。失敗を test する場合は `client.markFailed` で明示して partial history を確認する。

### 差分と dry run を確認する test

`diffSchema(prev, next)` で table と column の added、removed、type_changed、nullable_changed を検証する。primary と unique は差分に含まれない。`planDryRun` も使い、破壊的な SQL を実行前に止める assertion を生成する。

## 使用例

```bash
/kiwa-migration --module 0042-users --output tests/integration/0042-users.migration.test.ts
/kiwa-migration --module 0055-orders --provider prisma
```
