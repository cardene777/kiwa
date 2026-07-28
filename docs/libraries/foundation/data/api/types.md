---
title: "@kiwa-lab/data types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/data</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>CronEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L43) <code v-pre>packages/data/src/types.ts</code>

```ts
export interface CronEntry {
    id: string;
    intervalMs: number;
    lastRunMs: number;
    fn: () => void | Promise<void>;
}
```

#### <code v-pre>FakeClock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L50) <code v-pre>packages/data/src/types.ts</code>

```ts
export interface FakeClock {
    nowMs: () => number;
    advanceMs: (ms: number) => Promise<void>;
    schedule: (intervalMs: number, fn: () => void | Promise<void>) => string;
    unschedule: (id: string) => void;
    pendingEntries: () => CronEntry[];
}
```

#### <code v-pre>QueueAckHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L11) <code v-pre>packages/data/src/types.ts</code>

```ts
export interface QueueAckHandle {
    ack: () => void;
    nack: () => void;
}
```

#### <code v-pre>QueueClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L21) <code v-pre>packages/data/src/types.ts</code>

```ts
export interface QueueClient<T = unknown> {
    send: (body: T, opts?: {
        dedupKey?: string;
    }) => string;
    receive: () => QueueMessage<T> | null;
    /** Subscribe a handler that processes every send + retries until ack */
    consume: (handler: QueueHandler<T>) => () => void;
    size: () => number;
    dlqSize: () => number;
    drainDlq: () => QueueMessage<T>[];
}
```

#### <code v-pre>QueueHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L16) <code v-pre>packages/data/src/types.ts</code>

```ts
export type QueueHandler<T> = (message: QueueMessage<T>, ack: QueueAckHandle) => void | Promise<void>;
```

#### <code v-pre>QueueMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L3) <code v-pre>packages/data/src/types.ts</code>

```ts
export interface QueueMessage<T = unknown> {
    id: string;
    body: T;
    receivedCount: number;
    /** Optional dedup key for idempotency tests */
    dedupKey?: string;
}
```

#### <code v-pre>QueueTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L39) <code v-pre>packages/data/src/types.ts</code>

```ts
export interface QueueTestEnv<T = unknown> extends TestEnvBase<'mock' | 'live'> {
    client: QueueClient<T>;
}
```

#### <code v-pre>SetupQueueEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L31) <code v-pre>packages/data/src/types.ts</code>

```ts
export interface SetupQueueEnvOptions<T = unknown> {
    mode: Extract<TestMode, 'mock' | 'live'>;
    /** Maximum receive count before a message is sent to the dead letter queue */
    maxReceiveCount?: number;
    /** Optional initial messages */
    seed?: T[];
}
```
