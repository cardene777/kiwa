---
title: "@kiwa-lab/migration client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/migration</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createMigrationClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L49) <code v-pre>packages/migration/src/client.ts</code>

provider 差 (Prisma / Drizzle / Kysely / Knex) を吸収した migration mock client。 runUp / runDown / applyPendingMigrations 経由でこの client の applied array を更新する。

```ts
export declare function createMigrationClient(options?: CreateMigrationClientOptions): MigrationClient;
```

### 型

#### <code v-pre>Migration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L5) <code v-pre>packages/migration/src/client.ts</code>

```ts
export interface Migration {
    id: string;
    name: string;
    up: string;
    down: string;
}
```

#### <code v-pre>MigrationClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L29) <code v-pre>packages/migration/src/client.ts</code>

```ts
export interface MigrationClient {
    provider: MigrationProvider;
    applied: MigrationRecord[];
    now: () => number;
    markApplied: (migration: Migration) => MigrationResult;
    markRolledBack: (id: string) => MigrationResult;
    markFailed: (migration: Migration, reason: string) => MigrationResult;
    clear: () => void;
}
```

#### <code v-pre>MigrationProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L1) <code v-pre>packages/migration/src/client.ts</code>

```ts
export type MigrationProvider = 'prisma' | 'drizzle' | 'kysely' | 'knex';
```

#### <code v-pre>MigrationRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L12) <code v-pre>packages/migration/src/client.ts</code>

```ts
export interface MigrationRecord {
    id: string;
    name: string;
    status: MigrationStatus;
    appliedAt?: number;
    rolledBackAt?: number;
    reason?: string;
}
```

#### <code v-pre>MigrationResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L21) <code v-pre>packages/migration/src/client.ts</code>

```ts
export interface MigrationResult {
    id: string;
    provider: MigrationProvider;
    status: MigrationStatus;
    appliedAt: number;
    reason?: string;
}
```

#### <code v-pre>MigrationStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L3) <code v-pre>packages/migration/src/client.ts</code>

```ts
export type MigrationStatus = 'pending' | 'applied' | 'rolled_back' | 'failed';
```
