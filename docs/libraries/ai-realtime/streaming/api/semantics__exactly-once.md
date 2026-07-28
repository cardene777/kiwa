---
title: "@kiwa-lab/streaming semantics__exactly-once の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>semantics&#95;&#95;exactly-once</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createExactlyOnceSemantics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L55) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

Create the cross-provider exactly-once semantics wrapper. Records enqueued between `begin()` and `commit()` become part of an atomic batch — nothing lands until commit succeeds. `abort()` discards the batch, and a `read-committed` filter excludes any message tagged with an aborted batch id (delivered as a header `x-kiwa-txn-aborted: true`).

```ts
export declare function createExactlyOnceSemantics<TValue = unknown>(config: ExactlyOnceConfig): ExactlyOnceSemantics<TValue>;
```

#### <code v-pre>EXACTLY&#95;ONCE&#95;SEMANTICS&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L12) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

```ts
export declare const EXACTLY_ONCE_SEMANTICS_SYMBOL: unique symbol;
```

#### <code v-pre>isExactlyOnceSemantics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L142) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

Type guard: recognize an ExactlyOnceSemantics wrapper.

```ts
export declare function isExactlyOnceSemantics(value: unknown): value is ExactlyOnceSemantics<unknown>;
```

### 型

#### <code v-pre>ExactlyOnceConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L18) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

```ts
export interface ExactlyOnceConfig {
    readonly provider: StreamingProvider;
    readonly transactionalId: string;
    readonly isolationLevel?: IsolationLevel;
}
```

#### <code v-pre>ExactlyOnceSemantics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L32) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

```ts
export interface ExactlyOnceSemantics<TValue = unknown> {
    readonly [EXACTLY_ONCE_SEMANTICS_SYMBOL]: true;
    readonly config: Required<ExactlyOnceConfig>;
    begin(): void;
    send(record: PendingRecord<TValue>): void;
    commit(): readonly StreamingMessage<TValue>[];
    abort(): void;
    state(): TxnState;
    /** Filter a stream according to the configured isolation level. */
    filter(messages: readonly StreamingMessage<TValue>[]): readonly StreamingMessage<TValue>[];
    reset(): void;
}
```

#### <code v-pre>PendingRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L24) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

```ts
export interface PendingRecord<TValue = unknown> {
    readonly topic: string;
    readonly value: TValue;
    readonly key: string | null;
}
```
