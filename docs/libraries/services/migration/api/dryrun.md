---
title: "@kiwa-lab/migration dryrun の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/migration</code> <code v-pre>dryrun</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>planDryRun</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L13) <code v-pre>packages/migration/src/dryrun.ts</code>

migration 列を「dry-run」 で解析、 実 SQL を実行せずに safe / risky / destructive の 3 段階リスク分類 + 総 step 数 + destructive 数を返す。 real Prisma `migrate diff --dry-run` 相当。

```ts
export declare function planDryRun(pending: readonly Migration[], direction?: 'up' | 'down'): DryRunPlan;
```

#### <code v-pre>resolveDependencyOrder</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L40) <code v-pre>packages/migration/src/dryrun.ts</code>

```ts
export declare function resolveDependencyOrder(migrations: readonly MigrationWithDeps[]): MigrationWithDeps[];
```

### 型

#### <code v-pre>DryRunPlan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L3) <code v-pre>packages/migration/src/dryrun.ts</code>

```ts
export interface DryRunPlan {
    operations: Array<{
        id: string;
        direction: 'up' | 'down';
        sql: string;
        estimated: 'safe' | 'risky' | 'destructive';
    }>;
    totalSteps: number;
    destructiveCount: number;
}
```

#### <code v-pre>MigrationWithDeps</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L36) <code v-pre>packages/migration/src/dryrun.ts</code>

migration 間の dependency (id 参照) を解決、 topological order で並び替える。 real migration lib の depends-on 解決相当、 循環参照は throw。

```ts
export interface MigrationWithDeps extends Migration {
    dependsOn?: string[];
}
```
