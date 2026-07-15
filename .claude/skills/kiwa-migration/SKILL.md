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

`@kiwa-lab/migration` の 4 provider (Prisma / Drizzle / Kysely / Knex) 統一 mock を使った migration test を Vitest 形式で生成する。

## 目的

DB schema migration を「provider を差し替えても同じ up/down 挙動を担保する」 test で書く。 provider 別 migration API (Prisma migrate / Drizzle drizzle-kit / Kysely migrator / Knex migrate) を吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/migration` install 済
- Vitest 環境
- 対象 module に migration 定義 (up/down function 対) が存在

## オプション

- `--module {name}` — test 対象 module
- `--provider {prisma|drizzle|kysely|knex}` — 主要 provider
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: runUp + runDown reversibility test 生成

`createMigrationClient({ provider })` で client、 `runUp(client, migration)` → `runDown(client, migration)` の reversible cycle で schema が元 state に戻る verify。 4 provider を it.each で回す。

### Step 2: applyPendingMigrations + listAppliedMigrations test 生成

`applyPendingMigrations(client, [m1, m2, m3])` で順次適用、 `listAppliedMigrations(client)` で history 順序 assert。 途中 fail 時の rollback + partial-applied state の verify。

### Step 3: diffSchema test 生成

`diffSchema(prev, next)` で added / removed / changed columns/tables を抽出、 column type change / nullable → not null / index 追加の 3 case で分岐 cover。

## 使用例

```bash
/kiwa-migration --module 0042-users --output tests/integration/0042-users.migration.test.ts
/kiwa-migration --module 0055-orders --provider prisma
```
