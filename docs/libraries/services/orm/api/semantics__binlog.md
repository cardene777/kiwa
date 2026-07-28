---
title: "@kiwa-lab/orm semantics__binlog の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics&#95;&#95;binlog</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>advanceBinlogPosition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L60) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export declare function advanceBinlogPosition(session: BinlogSession, input: {
    file: string;
    position: number;
}): AxisStep<BinlogState>;
```

#### <code v-pre>createBinlogSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L42) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export declare function createBinlogSession(input: {
    serverId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): BinlogSession;
```

#### <code v-pre>detectGtidGap</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L139) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export declare function detectGtidGap(session: BinlogSession, input: {
    expectedGtid: string;
}): AxisStep<BinlogState>;
```

#### <code v-pre>negotiateBinlogFormat</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L117) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export declare function negotiateBinlogFormat(session: BinlogSession, input: {
    format: BinlogFormat;
}): AxisStep<BinlogState>;
```

#### <code v-pre>updateGtidSet</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L89) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export declare function updateGtidSet(session: BinlogSession, input: {
    gtid: string;
}): AxisStep<BinlogState>;
```

### 型

#### <code v-pre>BinlogFormat</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L23) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export type BinlogFormat = 'ROW' | 'STATEMENT' | 'MIXED';
```

#### <code v-pre>BinlogSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L25) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export interface BinlogSession {
    serverId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: BinlogState;
    file: string;
    position: number;
    format: BinlogFormat | null;
    gtidSet: Set<string>;
    history: AxisStep<BinlogState>[];
}
```

#### <code v-pre>BinlogState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L16) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

Binlog — MySQL binary log position tracking, GTID set maintenance, binlog_format negotiation, and GTID gap detection. MySQL maps to real binlog / GTID telemetry; Postgres approximates with WAL LSN concepts; SQLite falls back to WAL / changeset names. State transitions: created → 'idle' advanceBinlogPosition → 'positioned' updateGtidSet → 'gtid-updated' negotiateBinlogFormat → 'format-negotiated' detectGtidGap → 'gap-detected'

```ts
export type BinlogState = 'idle' | 'positioned' | 'gtid-updated' | 'format-negotiated' | 'gap-detected';
```
