---
title: "@kiwa-lab/edge semantics__do-state-migration の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics&#95;&#95;do-state-migration</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>bumpSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L71) <code v-pre>packages/edge/src/semantics/do-state-migration.ts</code>

Bump schema version registry. Emits `do-migration.schema-bumped` and transitions to `schema-bumped`. Instances still hold old data until migrateInstance is called per instance.

```ts
export declare function bumpSchema(session: DoMigrationSession): AxisStep<DoMigrationState>;
```

#### <code v-pre>completeRollout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L134) <code v-pre>packages/edge/src/semantics/do-state-migration.ts</code>

Complete the rollout once every instance is at `toVersion`. Emits `do-migration.rolled-out`. Rejects if any instance is still on the old version (partial rollout).

```ts
export declare function completeRollout(session: DoMigrationSession): AxisStep<DoMigrationState>;
```

#### <code v-pre>initiateMigration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L27) <code v-pre>packages/edge/src/semantics/do-state-migration.ts</code>

Initiate a migration from `fromVersion` to `toVersion` for a set of instances. Emits `do-migration.initiated`. All instances start at `fromVersion`.

```ts
export declare function initiateMigration(input: {
    platform: EdgePlatform;
    fromVersion: number;
    toVersion: number;
    instanceIds: string[];
}): DoMigrationSession;
```

#### <code v-pre>migrateInstance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L95) <code v-pre>packages/edge/src/semantics/do-state-migration.ts</code>

Migrate a single instance's data. Advances that instance's version to `toVersion` and increments the migrated count. Emits `do-migration.data-migrated`. Rejects if the instance is not registered or already migrated.

```ts
export declare function migrateInstance(session: DoMigrationSession, input: {
    instanceId: string;
}): AxisStep<DoMigrationState>;
```

#### <code v-pre>rollbackMigration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L163) <code v-pre>packages/edge/src/semantics/do-state-migration.ts</code>

Roll back the migration by resetting every instance to `fromVersion`. Used on rollout failure or a bad schema shipping. Transitions to `rolled-back`.

```ts
export declare function rollbackMigration(session: DoMigrationSession): void;
```

### 型

#### <code v-pre>DoMigrationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L12) <code v-pre>packages/edge/src/semantics/do-state-migration.ts</code>

```ts
export interface DoMigrationSession {
    platform: EdgePlatform;
    fromVersion: number;
    toVersion: number;
    instances: Map<string, number>;
    migratedCount: number;
    state: DoMigrationState;
    history: AxisStep<DoMigrationState>[];
}
```

#### <code v-pre>DoMigrationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L10) <code v-pre>packages/edge/src/semantics/do-state-migration.ts</code>

DurableObject state migration axis — schema versioning + zero-downtime rollout across DO instances. Migrations bump a schema version and apply a transform to each instance's state, but old workers may still be reading the previous schema during rollout. The helper tracks per-instance schema version so tests can assert atomic migration + safe rollback.

```ts
export type DoMigrationState = 'initiated' | 'schema-bumped' | 'data-migrated' | 'rolled-out' | 'rolled-back';
```
