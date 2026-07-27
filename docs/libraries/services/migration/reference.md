# @kiwa-lab/migration リファレンス

migration の履歴、schema 差分、実行計画を扱う公開 API です。すべてプロセス内で完結し、実 DB への接続や SQL 実行は行いません。

## client と migration

`createMigrationClient` は `prisma`、`drizzle`、`kysely`、`knex` のいずれかを provider として持つ client を作ります。provider の既定値は `prisma` です。

```ts
const client = createMigrationClient({
  provider: "knex",
  now: () => 1_700_000_000_000,
  seedApplied: [],
});
```

`Migration` は `id`、`name`、`up`、`down` の四つを必須とします。`now` は result と履歴の時刻を固定したい test で使えます。`seedApplied` は既存履歴を持つ状態からの検証用です。

## 適用と取り消し

| API | 入力 | 結果 |
| --- | --- | --- |
| `runUp` | client と `Migration` | `applied` の `MigrationResult`。同じ id がすでに applied なら同じ status と `already applied` の reason を返す |
| `runDown` | client と migration id | 対象を `rolled_back` に更新。対象がなければ `failed` と `not applied` を返す |
| `applyPendingMigrations` | client と `Migration[]` | id 昇順で適用し、`applied`、`skipped`、`failed` を返す |

`applyPendingMigrations` は failed が返った後の migration を `skipped` に入れます。途中で自動 rollback はしません。

## 履歴

`listAppliedMigrations` は配列ではなく `MigrationHistory` を返します。`total` は取り消し済みと失敗も含む record 数です。`latestApplied` は applied の挿入順で最後の record であり、時刻が同じでも安定します。

```ts
const history = listAppliedMigrations(client);
expect(history).toMatchObject({ provider: "knex", total: 2 });
expect(history.applied).toHaveLength(1);
expect(history.rolledBack).toHaveLength(1);
```

## schema 差分

`diffSchema(previous, next)` は `addedTables`、`removedTables`、`columnDiffs` を返します。列では `added`、`removed`、`type_changed`、`nullable_changed` のみを検出します。primary と unique の変更は検出対象外です。

## 実行計画と依存関係

`planDryRun(migrations, direction)` は `up` または `down` の SQL とリスク推定を返します。direction の既定値は `up` です。

`resolveDependencyOrder` は `dependsOn` を持つ migration を依存先から先に並べます。存在しない依存先と循環依存では例外を送出するため、その入力は test で明示的に検証してください。

`createLockRegistry` は scope と owner による advisory lock を扱います。同じ scope の有効な lock は `null` を返し、所有者が違う `release` は `false` を返します。期限切れの lock は次の `acquire` で置き換えられます。

## 状態をリセットする

`client.clear()` は client の履歴を空にします。外部接続は作られないため、通常は test ごとに client を作るだけで十分です。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `cyclic dependency detected at ${id}` | [packages/migration/src/dryrun.ts](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L47) |
| `unknown migration referenced: ${id}` | [packages/migration/src/dryrun.ts](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L49) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `applyPendingMigrations`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/up-down.ts#L31) `packages/migration/src/up-down.ts`

pending 全 migration を id 昇順で適用。 failed が出た時点で以降 skip。

```ts
export declare function applyPendingMigrations(client: MigrationClient, migrations: Migration[]): ApplyPendingResult;
```

#### `createLockRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/lock.ts#L12) `packages/migration/src/lock.ts`

migration lock (advisory) を管理する mock。 real Postgres advisory lock / SQLite `PRAGMA locking_mode = EXCLUSIVE` 相当を in-memory で模倣。 並行走行を防ぎ、 duplicate migration apply を排除。

```ts
export declare function createLockRegistry(now?: () => number): {
    acquire(scope: string, owner: string, ttlMs?: number): MigrationLock | null;
    release(scope: string, owner: string): boolean;
    listActive(): Array<{
        scope: string;
        lock: MigrationLock;
    }>;
};
```

#### `createMigrationClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L49) `packages/migration/src/client.ts`

provider 差 (Prisma / Drizzle / Kysely / Knex) を吸収した migration mock client。 runUp / runDown / applyPendingMigrations 経由でこの client の applied array を更新する。

```ts
export declare function createMigrationClient(options?: CreateMigrationClientOptions): MigrationClient;
```

#### `diffSchema`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L36) `packages/migration/src/diff.ts`

prev / next schema の diff を計算。 実 provider (Prisma introspect / Drizzle schema push / Kysely migration generate) が返す diff の抽象 shape。

```ts
export declare function diffSchema(prev: Schema, next: Schema): SchemaDiff;
```

#### `listAppliedMigrations`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/history.ts#L16) `packages/migration/src/history.ts`

client.applied を category 別 (applied / rolled_back / failed) に集計。 latestApplied = appliedAt max の record (無ければ undefined)。

```ts
export declare function listAppliedMigrations(client: MigrationClient): MigrationHistory;
```

#### `planDryRun`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L13) `packages/migration/src/dryrun.ts`

migration 列を「dry-run」 で解析、 実 SQL を実行せずに safe / risky / destructive の 3 段階リスク分類 + 総 step 数 + destructive 数を返す。 real Prisma `migrate diff --dry-run` 相当。

```ts
export declare function planDryRun(pending: readonly Migration[], direction?: 'up' | 'down'): DryRunPlan;
```

#### `resolveDependencyOrder`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L40) `packages/migration/src/dryrun.ts`

```ts
export declare function resolveDependencyOrder(migrations: readonly MigrationWithDeps[]): MigrationWithDeps[];
```

#### `runDown`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/up-down.ts#L24) `packages/migration/src/up-down.ts`

1 migration の down 実行 mock。 markRolledBack で client.applied の status を更新。

```ts
export declare function runDown(client: MigrationClient, migrationId: string): MigrationResult;
```

#### `runUp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/up-down.ts#L13) `packages/migration/src/up-down.ts`

1 migration の up 実行 mock。 実 provider (Prisma migrate / Drizzle push / Kysely migrator / Knex migrate) は client.applied を更新する経路で invoke される。

```ts
export declare function runUp(client: MigrationClient, migration: Migration): MigrationResult;
```

### 型

#### `ApplyPendingResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/up-down.ts#L3) `packages/migration/src/up-down.ts`

```ts
export interface ApplyPendingResult {
    applied: MigrationResult[];
    skipped: string[];
    failed: MigrationResult[];
}
```

#### `ColumnDiff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L18) `packages/migration/src/diff.ts`

```ts
export interface ColumnDiff {
    table: string;
    column: string;
    change: 'added' | 'removed' | 'type_changed' | 'nullable_changed';
    before?: SchemaColumn;
    after?: SchemaColumn;
}
```

#### `DryRunPlan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L3) `packages/migration/src/dryrun.ts`

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

#### `Migration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L5) `packages/migration/src/client.ts`

```ts
export interface Migration {
    id: string;
    name: string;
    up: string;
    down: string;
}
```

#### `MigrationClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L29) `packages/migration/src/client.ts`

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

#### `MigrationHistory`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/history.ts#L3) `packages/migration/src/history.ts`

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

#### `MigrationLock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/lock.ts#L1) `packages/migration/src/lock.ts`

```ts
export interface MigrationLock {
    owner: string;
    acquiredAt: number;
    ttlMs: number;
}
```

#### `MigrationProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L1) `packages/migration/src/client.ts`

```ts
export type MigrationProvider = 'prisma' | 'drizzle' | 'kysely' | 'knex';
```

#### `MigrationRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L12) `packages/migration/src/client.ts`

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

#### `MigrationResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L21) `packages/migration/src/client.ts`

```ts
export interface MigrationResult {
    id: string;
    provider: MigrationProvider;
    status: MigrationStatus;
    appliedAt: number;
    reason?: string;
}
```

#### `MigrationStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/client.ts#L3) `packages/migration/src/client.ts`

```ts
export type MigrationStatus = 'pending' | 'applied' | 'rolled_back' | 'failed';
```

#### `MigrationWithDeps`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L36) `packages/migration/src/dryrun.ts`

migration 間の dependency (id 参照) を解決、 topological order で並び替える。 real migration lib の depends-on 解決相当、 循環参照は throw。

```ts
export interface MigrationWithDeps extends Migration {
    dependsOn?: string[];
}
```

#### `Schema`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L14) `packages/migration/src/diff.ts`

```ts
export interface Schema {
    tables: SchemaTable[];
}
```

#### `SchemaColumn`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L1) `packages/migration/src/diff.ts`

```ts
export interface SchemaColumn {
    name: string;
    type: string;
    nullable: boolean;
    primary?: boolean;
    unique?: boolean;
}
```

#### `SchemaDiff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L26) `packages/migration/src/diff.ts`

```ts
export interface SchemaDiff {
    addedTables: string[];
    removedTables: string[];
    columnDiffs: ColumnDiff[];
}
```

#### `SchemaTable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L9) `packages/migration/src/diff.ts`

```ts
export interface SchemaTable {
    name: string;
    columns: SchemaColumn[];
}
```
<!-- kiwa-public-api:end -->
