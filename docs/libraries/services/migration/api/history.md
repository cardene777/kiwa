---
title: "@kiwa-lab/migration history の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/migration</code> <code v-pre>history</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/history.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>listAppliedMigrations</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/history.ts#L16) <code v-pre>packages/migration/src/history.ts</code>

client.applied を category 別 (applied / rolled_back / failed) に集計。 latestApplied = appliedAt max の record (無ければ undefined)。

```ts
export declare function listAppliedMigrations(client: MigrationClient): MigrationHistory;
```

### 型

#### <code v-pre>MigrationHistory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/history.ts#L3) <code v-pre>packages/migration/src/history.ts</code>

```ts
export interface MigrationHistory {
    provider: string;
    total: number;
    applied: MigrationRecord[];
    rolledBack: MigrationRecord[];
    failed: MigrationRecord[];
    latestApplied?: MigrationRecord;
}
```
