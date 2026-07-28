---
title: "@kiwa-lab/migration up-down の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/migration</code> <code v-pre>up-down</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/up-down.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>applyPendingMigrations</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/up-down.ts#L31) <code v-pre>packages/migration/src/up-down.ts</code>

pending 全 migration を id 昇順で適用。 failed が出た時点で以降 skip。

```ts
export declare function applyPendingMigrations(client: MigrationClient, migrations: Migration[]): ApplyPendingResult;
```

#### <code v-pre>runDown</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/up-down.ts#L24) <code v-pre>packages/migration/src/up-down.ts</code>

1 migration の down 実行 mock。 markRolledBack で client.applied の status を更新。

```ts
export declare function runDown(client: MigrationClient, migrationId: string): MigrationResult;
```

#### <code v-pre>runUp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/up-down.ts#L13) <code v-pre>packages/migration/src/up-down.ts</code>

1 migration の up 実行 mock。 実 provider (Prisma migrate / Drizzle push / Kysely migrator / Knex migrate) は client.applied を更新する経路で invoke される。

```ts
export declare function runUp(client: MigrationClient, migration: Migration): MigrationResult;
```

### 型

#### <code v-pre>ApplyPendingResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/up-down.ts#L3) <code v-pre>packages/migration/src/up-down.ts</code>

```ts
export interface ApplyPendingResult {
    applied: MigrationResult[];
    skipped: string[];
    failed: MigrationResult[];
}
```
