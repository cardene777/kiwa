---
title: "@kiwa-lab/queue sqs__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>sqs&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>SetupSQSEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L172) <code v-pre>packages/queue/src/sqs/types.ts</code>

Common options for the `setupSQSEnv` factory.

```ts
export interface SetupSQSEnvOptions {
    /** Backend selector. Defaults to `'stub'`. */
    mode?: SQSMode | undefined;
    /**
     * Queue specs to create at env creation time. Additional queues can be
     * created later via `createQueue`.
     */
    queues?: SQSQueueSpec[] | undefined;
    /** AWS access credentials (localstack mode uses dummy defaults). */
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
    } | undefined;
    /** localstack overrides. */
    localstack?: SQSLocalstackOptions | undefined;
}
```

#### <code v-pre>SQSBatchDeleteEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L122) <code v-pre>packages/queue/src/sqs/types.ts</code>

Options for a batch delete.

```ts
export interface SQSBatchDeleteEntry {
    id: string;
    receiptHandle: string;
}
```

#### <code v-pre>SQSBatchSendEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L115) <code v-pre>packages/queue/src/sqs/types.ts</code>

Options for a batch send.

```ts
export interface SQSBatchSendEntry<TBody = unknown> {
    id: string;
    body: TBody;
    options?: SQSSendOptions | undefined;
}
```

#### <code v-pre>SQSLocalstackOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L153) <code v-pre>packages/queue/src/sqs/types.ts</code>

Options for the localstack backend. Ignored when `mode === 'stub'`.

```ts
export interface SQSLocalstackOptions {
    /** Docker image for LocalStack. Defaults to `localstack/localstack:3`. */
    image?: string | undefined;
    /**
     * Reuse an existing LocalStack endpoint URL (e.g. `http://localhost:4566`)
     * instead of spawning a container. When set, the helper skips
     * testcontainers and connects directly.
     */
    endpoint?: string | undefined;
    /** AWS region. Defaults to `us-east-1`. */
    region?: string | undefined;
    /**
     * Milliseconds to wait for the auto-spawned container before timing out.
     * Defaults to `60000`.
     */
    startupTimeoutMs?: number | undefined;
}
```

#### <code v-pre>SQSMessageSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L40) <code v-pre>packages/queue/src/sqs/types.ts</code>

Structural mirror of a persisted SQS message.

```ts
export interface SQSMessageSnapshot<TBody = unknown> {
    messageId: string;
    queueName: string;
    body: TBody;
    receiveCount: number;
    state: SQSMessageState;
    failedReason?: string | undefined;
    /** FIFO — non-empty when kind === 'fifo'. */
    messageGroupId?: string | undefined;
    messageDeduplicationId?: string | undefined;
    /**
     * ISO ms timestamp — when the message becomes visible for the next receive
     * (send time + delaySeconds, or receive time + visibilityTimeoutSeconds
     * while in-flight).
     */
    visibleAt: number;
}
```

#### <code v-pre>SQSMessageState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L33) <code v-pre>packages/queue/src/sqs/types.ts</code>

Terminal + intermediate states surfaced by the helper. `pending` messages live in the queue waiting for the next receive. `inflight` messages have been received and are within their visibility timeout window. `deleted` covers messages the consumer explicitly deleted. `dead` covers messages that exhausted `maxReceiveCount` and were routed to the DLQ.

```ts
export type SQSMessageState = 'pending' | 'inflight' | 'deleted' | 'dead';
```

#### <code v-pre>SQSMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L12) <code v-pre>packages/queue/src/sqs/types.ts</code>

AWS SQS backend selection. - `stub`: in-process, deterministic FIFO / standard queue emulation. No docker, no network. Suitable for unit tests that need to exercise the send / receive / delete / batch / visibility timeout / DLQ semantics without spinning up localstack. - `localstack`: run against a real LocalStack container. Exercises the actual `@aws-sdk/client-sqs` wire with a real (offline) SQS API.

```ts
export type SQSMode = 'stub' | 'localstack';
```

#### <code v-pre>SQSQueueKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L24) <code v-pre>packages/queue/src/sqs/types.ts</code>

FIFO / standard queue kind. FIFO queues require `.fifo` suffix on the queue name and honour `MessageGroupId` + `MessageDeduplicationId`.

```ts
export type SQSQueueKind = 'standard' | 'fifo';
```

#### <code v-pre>SQSQueueSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L131) <code v-pre>packages/queue/src/sqs/types.ts</code>

Queue declaration — passed to `setupSQSEnv({ queues: [...] })` to create the queue up front (both stub + localstack modes honour this).

```ts
export interface SQSQueueSpec {
    /** Queue name — for FIFO queues must end with `.fifo`. */
    name: string;
    /** Queue kind — defaults to `standard`. */
    kind?: SQSQueueKind | undefined;
    /**
     * Queue-level default visibility timeout (seconds). Defaults to 30 which
     * matches production SQS.
     */
    visibilityTimeoutSeconds?: number | undefined;
    /**
     * DLQ config — when set, messages that exceed `maxReceiveCount` receives
     * are routed to `deadLetterTargetArn` (in stub mode the arn is treated as
     * a plain queue name).
     */
    redrivePolicy?: {
        deadLetterTargetArn: string;
        maxReceiveCount: number;
    } | undefined;
}
```

#### <code v-pre>SQSReceivedMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L103) <code v-pre>packages/queue/src/sqs/types.ts</code>

Received message wrapper — consumers call `.delete()` to remove the message after successful processing, `.changeVisibility()` to extend the inflight window, or let the visibility timeout expire so the message returns to the queue.

```ts
export interface SQSReceivedMessage<TBody = unknown> {
    messageId: string;
    receiptHandle: string;
    body: TBody;
    receiveCount: number;
    messageGroupId?: string | undefined;
    messageDeduplicationId?: string | undefined;
    delete: () => void;
    changeVisibility: (timeoutSeconds: number) => void;
}
```

#### <code v-pre>SQSReceiveOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L79) <code v-pre>packages/queue/src/sqs/types.ts</code>

Options accepted by {@link SQSTestEnv.receive}.

```ts
export interface SQSReceiveOptions {
    /**
     * Max messages returned in one receive call. SQS caps at 10 — the helper
     * honours the same cap. Defaults to 1.
     */
    maxMessages?: number | undefined;
    /**
     * Visibility timeout for the returned messages (seconds). Defaults to the
     * queue-level `visibilityTimeoutSeconds` (30s if unset).
     */
    visibilityTimeoutSeconds?: number | undefined;
    /**
     * Long-poll wait time. When > 0 the helper will wait up to this many
     * seconds for a message to become visible. Defaults to 0.
     */
    waitTimeSeconds?: number | undefined;
}
```

#### <code v-pre>SQSSendOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L59) <code v-pre>packages/queue/src/sqs/types.ts</code>

Options accepted by every {@link SQSTestEnv.send} call.

```ts
export interface SQSSendOptions {
    /**
     * Delay before the message becomes eligible for the next receive
     * (seconds). Real SQS caps at 900. Defaults to 0.
     */
    delaySeconds?: number | undefined;
    /**
     * FIFO — required when the queue kind is `fifo`. Groups messages so
     * consumers in the same group process them in order.
     */
    messageGroupId?: string | undefined;
    /**
     * FIFO — optional deduplication token. Duplicate `send` calls with the
     * same deduplication id within the 5-minute production window are treated
     * as no-ops. The helper uses the same rule but without the time bound.
     */
    messageDeduplicationId?: string | undefined;
}
```

#### <code v-pre>SQSTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L194) <code v-pre>packages/queue/src/sqs/types.ts</code>

Return type of {@link setupSQSEnv }. Reads much like a mini SQS facade — consumers create queues, send / receive / delete messages, and use the assertion helpers to observe outcomes without touching the wire.

```ts
export interface SQSTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    /** Chosen backend — mirrors the `mode` parameter. */
    backend: SQSMode;
    /** Localstack endpoint URL — undefined in stub mode. */
    endpoint: string | undefined;
    /** Queue names the env has observed. */
    queues: string[];
    /** Create (or replace) a queue. */
    createQueue: (spec: SQSQueueSpec) => Promise<void>;
    /** Enqueue a message. Returns the snapshot at enqueue time. */
    send: <TBody = unknown>(queueName: string, body: TBody, options?: SQSSendOptions) => Promise<SQSMessageSnapshot<TBody>>;
    /** Batch enqueue — up to 10 messages per call (mirrors SQS SendMessageBatch). */
    sendBatch: <TBody = unknown>(queueName: string, entries: SQSBatchSendEntry<TBody>[]) => Promise<SQSMessageSnapshot<TBody>[]>;
    /** Receive a batch — up to 10 messages per call. */
    receive: <TBody = unknown>(queueName: string, options?: SQSReceiveOptions) => Promise<SQSReceivedMessage<TBody>[]>;
    /** Batch delete — mirrors SQS DeleteMessageBatch. */
    deleteBatch: (queueName: string, entries: SQSBatchDeleteEntry[]) => Promise<void>;
    /**
     * Wait for the first message on `queueName` to reach a terminal state
     * (`deleted` or `dead`). Rejects on timeout (default 5s).
     */
    waitForMessage: <TBody = unknown>(queueName: string, opts?: {
        timeoutMs?: number | undefined;
    }) => Promise<SQSMessageSnapshot<TBody>>;
    /** Assertion — the first message on `queueName` was successfully deleted. */
    assertDeleted: <TBody = unknown>(queueName: string, expected?: {
        receiveCount?: number | undefined;
    } | undefined) => Promise<SQSMessageSnapshot<TBody>>;
    /** Assertion — the first message on `queueName` was routed to the DLQ. */
    assertDeadLettered: <TBody = unknown>(queueName: string, expected?: {
        dlq?: string | undefined;
        receiveCount?: number | undefined;
    } | undefined) => Promise<SQSMessageSnapshot<TBody>>;
    /** Assertion — the queue has no pending / inflight messages. */
    assertQueueDrained: (queueName?: string | undefined) => Promise<void>;
    /** Introspection helper — every message snapshot in a queue. */
    listMessages: (queueName?: string | undefined) => SQSMessageSnapshot[];
    /** Introspection helper — every message routed to a DLQ. */
    listDeadLetters: (dlqName?: string | undefined) => SQSMessageSnapshot[];
}
```
