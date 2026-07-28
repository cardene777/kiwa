---
title: "@kiwa-lab/migration lock の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/migration</code> <code v-pre>lock</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/lock.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createLockRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/lock.ts#L12) <code v-pre>packages/migration/src/lock.ts</code>

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

### 型

#### <code v-pre>MigrationLock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/lock.ts#L1) <code v-pre>packages/migration/src/lock.ts</code>

```ts
export interface MigrationLock {
    owner: string;
    acquiredAt: number;
    ttlMs: number;
}
```
