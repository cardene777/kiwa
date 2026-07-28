---
title: "@kiwa-lab/streaming dlq の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>dlq</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createDeadLetterQueue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L50) <code v-pre>packages/streaming/src/dlq.ts</code>

Create a DLQ-aware handler. Each incoming message is invoked against `handler`; on error, the message is re-tried up to `retryPolicy.maxAttempts` total attempts. When the budget is exhausted, the message is quarantined with the last error message + attempt count.

```ts
export declare function createDeadLetterQueue<TValue = unknown, TKey = string>(config: DeadLetterQueueConfig<TValue, TKey>): DeadLetterQueue<TValue, TKey>;
```

#### <code v-pre>DLQ&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L10) <code v-pre>packages/streaming/src/dlq.ts</code>

```ts
export declare const DLQ_SYMBOL: unique symbol;
```

#### <code v-pre>isDeadLetterQueue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L120) <code v-pre>packages/streaming/src/dlq.ts</code>

Type guard: recognize a DeadLetterQueue.

```ts
export declare function isDeadLetterQueue(value: unknown): value is DeadLetterQueue;
```

### 型

#### <code v-pre>BackoffKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L12) <code v-pre>packages/streaming/src/dlq.ts</code>

```ts
export type BackoffKind = 'constant' | 'linear' | 'exponential';
```

#### <code v-pre>DeadLetterQueue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L31) <code v-pre>packages/streaming/src/dlq.ts</code>

```ts
export interface DeadLetterQueue<TValue = unknown, TKey = string> {
    readonly [DLQ_SYMBOL]: true;
    readonly topic: string;
    readonly deadLetterTopic: string;
    /** Process one message through the retry + quarantine chain. */
    handle(message: StreamingMessage<TValue, TKey>): Promise<'handled' | 'quarantined'>;
    /** Immutable snapshot of currently quarantined entries. */
    quarantined(): readonly DeadLetterEntry<TValue, TKey>[];
    /** Manually enqueue an entry into the DLQ (useful for injecting fixtures). */
    quarantine(entry: DeadLetterEntry<TValue, TKey>): void;
    reset(): void;
}
```

#### <code v-pre>DeadLetterQueueConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L23) <code v-pre>packages/streaming/src/dlq.ts</code>

```ts
export interface DeadLetterQueueConfig<TValue = unknown, TKey = string> {
    readonly topic: string;
    readonly handler: MessageHandler<TValue, TKey>;
    readonly retryPolicy: RetryPolicy;
    /** Optional callback that receives every quarantined entry — useful for alert wiring. */
    readonly onDeadLetter?: (entry: DeadLetterEntry<TValue, TKey>) => void;
}
```

#### <code v-pre>RetryPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L14) <code v-pre>packages/streaming/src/dlq.ts</code>

```ts
export interface RetryPolicy {
    readonly maxAttempts: number;
    readonly backoff?: BackoffKind;
    /** Backoff base in ms — constant returns this, linear multiplies by attempt, exponential = base * 2^(attempt-1). */
    readonly baseDelayMs?: number;
    /** Cap the backoff delay so retries don't stall long-running tests. */
    readonly maxDelayMs?: number;
}
```
