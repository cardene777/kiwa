---
title: "@kiwa-lab/orm semantics__mvcc-advanced の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics&#95;&#95;mvcc-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>applyHotUpdate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L127) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export declare function applyHotUpdate(session: MvccAdvancedSession, input: {
    oldTupleId: string;
    newTupleId: string;
    chainLength: number;
}): AxisStep<MvccAdvancedState>;
```

#### <code v-pre>checkTupleVisibility</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L65) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export declare function checkTupleVisibility(session: MvccAdvancedSession, input: {
    tupleId: string;
    xmin: number;
    xmax?: number;
    snapshotXmin: number;
}): AxisStep<MvccAdvancedState>;
```

#### <code v-pre>createMvccAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L43) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export declare function createMvccAdvancedSession(input: {
    tableName: string;
    provider: OrmProvider;
    backend: OrmBackend;
    currentXid: number;
}): MvccAdvancedSession;
```

#### <code v-pre>detectXidWraparound</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L162) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export declare function detectXidWraparound(session: MvccAdvancedSession, input: {
    freezeXid: number;
    warningAge: number;
}): AxisStep<MvccAdvancedState>;
```

#### <code v-pre>measureBloat</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L96) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export declare function measureBloat(session: MvccAdvancedSession, input: {
    liveTuples: number;
    deadTuples: number;
}): AxisStep<MvccAdvancedState>;
```

### 型

#### <code v-pre>MvccAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L23) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export interface MvccAdvancedSession {
    tableName: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: MvccAdvancedState;
    visibleTuples: Set<string>;
    bloatRatio: number;
    hotChainLength: number;
    currentXid: number;
    history: AxisStep<MvccAdvancedState>[];
}
```

#### <code v-pre>MvccAdvancedState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L16) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

MVCC advanced — tuple visibility, table bloat, HOT update chains, and XID wraparound pressure. Postgres maps to heap tuple metadata and pg_stat_user_tables; MySQL approximates with InnoDB transaction metadata; SQLite falls back to snapshot / freelist style counters. State transitions: created → 'idle' checkTupleVisibility → 'visibility-checked' measureBloat → 'bloat-measured' applyHotUpdate → 'hot-updated' detectXidWraparound → 'xid-wraparound-detected'

```ts
export type MvccAdvancedState = 'idle' | 'visibility-checked' | 'bloat-measured' | 'hot-updated' | 'xid-wraparound-detected';
```
