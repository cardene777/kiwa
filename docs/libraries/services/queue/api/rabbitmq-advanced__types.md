---
title: "@kiwa-lab/queue rabbitmq-advanced__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>rabbitmq-advanced&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>RabbitMQAdvancedQueueSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L45) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Extension of the basic queue spec to accept DLX + TTL + quorum arguments.

```ts
export interface RabbitMQAdvancedQueueSpec extends RabbitMQQueueSpec {
    /**
     * When set, messages that are nacked (requeue=false) or that exceed the
     * queue-level `messageTtlMs` are routed to this exchange. Mirrors the AMQP
     * `x-dead-letter-exchange` argument.
     */
    deadLetterExchange?: string | undefined;
    /**
     * Overrides the routing key used when a message is dead-lettered. Real
     * RabbitMQ keeps the original routing key when this is unset — the mock
     * mirrors that behavior.
     */
    deadLetterRoutingKey?: string | undefined;
    /**
     * Queue-level message TTL (milliseconds). Messages older than this are
     * dead-lettered on the next dispatch attempt. Mirrors `x-message-ttl`.
     */
    messageTtlMs?: number | undefined;
    /**
     * Max delivery count before the message is dead-lettered. Mirrors
     * `x-delivery-limit` used with quorum queues.
     */
    maxDeliveries?: number | undefined;
    /**
     * Queue kind — `classic` (default) or `quorum`. Quorum queues carry
     * additional guarantees when running in a cluster.
     */
    kind?: 'classic' | 'quorum' | undefined;
}
```

#### <code v-pre>RabbitMQAdvancedTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L173) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Advanced test env. Adds `dlx`, `delayed`, `cluster`, `federation`, `autoReconnect` handles on top of the basic env API (which is re-exported verbatim so a single call site can drive both surfaces).

```ts
export interface RabbitMQAdvancedTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    backend: 'stub';
    /** Basic API surface — same shape as the v1.10-3 basic adapter. */
    declareExchange: (spec: RabbitMQExchangeSpec) => Promise<void>;
    declareQueue: (spec: RabbitMQAdvancedQueueSpec) => Promise<void>;
    bindQueue: (spec: RabbitMQBindingSpec) => Promise<void>;
    unbindQueue: (spec: RabbitMQBindingSpec) => Promise<void>;
    publish: <TBody = unknown>(input: {
        exchange: string;
        routingKey: string;
        body: TBody;
        options?: RabbitMQPublishOptions;
    }) => Promise<RabbitMQMessageSnapshot<TBody>>;
    sendToQueue: <TBody = unknown>(input: {
        queue: string;
        body: TBody;
        options?: RabbitMQPublishOptions;
    }) => Promise<RabbitMQMessageSnapshot<TBody>>;
    peek: <TBody = unknown>(queueName: string) => RabbitMQMessageSnapshot<TBody>[];
    get: <TBody = unknown>(input: {
        queue: string;
        noAck?: boolean;
    }) => Promise<RabbitMQDelivery<TBody> | null>;
    consume: <TBody = unknown>(input: {
        queue: string;
        handler: (delivery: RabbitMQDelivery<TBody>) => void | Promise<void>;
        options?: RabbitMQConsumeOptions;
    }) => Promise<RabbitMQConsumer<TBody>>;
    /** DLX helpers. */
    dlx: {
        /** Introspection — every dead-letter that has fired. */
        listDeadLetters: <TBody = unknown>() => RabbitMQDeadLetterSnapshot<TBody>[];
        /**
         * Assertion — the given queue's last dead-letter matches the expected
         * shape. Returns the snapshot on success.
         */
        assertDeadLettered: <TBody = unknown>(queue: string, expected?: {
            reason?: RabbitMQDeadLetterSnapshot['reason'];
            deadLetterExchange?: string;
        }) => Promise<RabbitMQDeadLetterSnapshot<TBody>>;
    };
    /** Delayed message plugin helpers. */
    delayed: {
        /** Declare a delayed exchange (equivalent to `type: 'x-delayed-message'`). */
        declareDelayedExchange: (spec: RabbitMQDelayedExchangeSpec) => Promise<void>;
        /** Publish with an explicit delay (mirrors the `x-delay` header). */
        publishDelayed: <TBody = unknown>(input: {
            exchange: string;
            routingKey: string;
            body: TBody;
            delayMs: number;
            options?: RabbitMQPublishOptions;
        }) => Promise<RabbitMQDelayedMessageSnapshot<TBody>>;
        /**
         * Wait until scheduled delivery lands on the target queue. Rejects on
         * timeout.
         */
        waitForDelivery: <TBody = unknown>(exchange: string, opts?: {
            timeoutMs?: number;
        }) => Promise<RabbitMQMessageSnapshot<TBody>>;
        /**
         * Advance the internal clock, causing any due delayed messages to fire
         * synchronously. Useful for deterministic tests.
         */
        advanceClock: (ms: number) => Promise<void>;
        /** Introspection — all delayed messages the env has seen. */
        listPending: <TBody = unknown>() => RabbitMQDelayedMessageSnapshot<TBody>[];
    };
    /** Cluster helpers. */
    cluster: {
        listNodes: () => RabbitMQClusterNode[];
        /** Simulate a node going offline — messages route to other active nodes. */
        stopNode: (id: string) => Promise<void>;
        /** Bring a node back online. */
        startNode: (id: string) => Promise<void>;
        /**
         * Report which node currently hosts a given quorum queue. Round-robin
         * across active nodes.
         */
        resolveQueueNode: (queueName: string) => string | null;
        /**
         * Assertion — the queue is a quorum queue and it is currently hosted on
         * an active node with the required replica count. Real quorum queues
         * demand `initialReplicas` copies; the mock enforces a minimum active
         * node count.
         */
        assertQuorumHealthy: (queueName: string, opts?: {
            minReplicas?: number;
        }) => void;
    };
    /** Federation helpers. */
    federation: {
        listUpstreams: () => RabbitMQFederationUpstream[];
        listLinks: () => RabbitMQFederationLink[];
        /**
         * Simulate a message arriving on an upstream that is federated into this
         * broker. Mirrors what a federation plugin would do on the wire.
         */
        ingestFromUpstream: <TBody = unknown>(input: {
            upstreamName: string;
            exchange: string;
            routingKey: string;
            body: TBody;
        }) => Promise<RabbitMQMessageSnapshot<TBody>>;
    };
    /** amqp-connection-manager style auto-reconnect helpers. */
    autoReconnect: {
        /**
         * Simulate the connection dropping and reconnecting after N attempts.
         * Returns the number of attempts + total delay observed.
         */
        simulateReconnect: (opts: {
            failAttempts: number;
        }) => Promise<{
            attempts: number;
            totalDelayMs: number;
            succeeded: boolean;
        }>;
        /** Introspection — current reconnect config. */
        getConfig: () => Required<NonNullable<SetupRabbitMQAdvancedEnvOptions['autoReconnect']>>;
    };
    /** Full reset. */
    reset: () => Promise<void>;
}
```

#### <code v-pre>RabbitMQClusterNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L90) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Node in a cluster.

```ts
export interface RabbitMQClusterNode {
    id: string;
    role: 'primary' | 'replica';
    /** True while the node is participating in the cluster. */
    active: boolean;
}
```

#### <code v-pre>RabbitMQDeadLetterSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L127) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Dead-letter snapshot — captured every time a message enters a DLX.

```ts
export interface RabbitMQDeadLetterSnapshot<TBody = unknown> {
    originalMessageId: string;
    originalQueue: string;
    deadLetterExchange: string;
    deadLetterRoutingKey: string;
    reason: 'rejected' | 'expired' | 'maxlen' | 'delivery-limit';
    body: TBody;
    deliveryCount: number;
    timestamp: number;
}
```

#### <code v-pre>RabbitMQDelayedExchangeSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L76) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Delayed exchange declaration.

```ts
export interface RabbitMQDelayedExchangeSpec extends Omit<RabbitMQExchangeSpec, 'type'> {
    /**
     * Delayed message plugin exchange type — real RabbitMQ uses the fixed
     * value `x-delayed-message` when the plugin is enabled.
     */
    type: 'x-delayed-message';
    /**
     * Backing exchange type — the plugin routes as the backing type once the
     * delay elapses. Defaults to `direct`.
     */
    delayedType?: 'direct' | 'topic' | 'fanout' | 'headers' | undefined;
}
```

#### <code v-pre>RabbitMQDelayedMessageSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L116) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Delayed message snapshot — inspection helper.

```ts
export interface RabbitMQDelayedMessageSnapshot<TBody = unknown> {
    messageId: string;
    exchange: string;
    routingKey: string;
    body: TBody;
    delayMs: number;
    scheduledAt: number;
    delivered: boolean;
}
```

#### <code v-pre>RabbitMQFederationLink</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L109) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Federation link — binds an upstream to a downstream exchange or queue.

```ts
export interface RabbitMQFederationLink {
    upstreamName: string;
    downstreamExchange?: string | undefined;
    downstreamQueue?: string | undefined;
}
```

#### <code v-pre>RabbitMQFederationUpstream</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L98) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Federation upstream (source broker).

```ts
export interface RabbitMQFederationUpstream {
    name: string;
    /** Upstream URI — recorded so tests can assert against it. */
    uri: string;
    /** Prefetch on the federation link. Mirrors real federation configuration. */
    prefetchCount?: number | undefined;
    /** Optional expiry — how long the federated link stays alive. */
    expires?: number | undefined;
}
```

#### <code v-pre>SetupRabbitMQAdvancedEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L139) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Options accepted by {@link setupRabbitMQAdvancedEnv }.

```ts
export interface SetupRabbitMQAdvancedEnvOptions {
    /** Standard exchanges (v1.10-3 basic API). */
    exchanges?: RabbitMQExchangeSpec[] | undefined;
    /** Delayed exchanges (this adapter). */
    delayedExchanges?: RabbitMQDelayedExchangeSpec[] | undefined;
    /** Queues with advanced arguments. */
    queues?: RabbitMQAdvancedQueueSpec[] | undefined;
    /** Bindings. */
    bindings?: RabbitMQBindingSpec[] | undefined;
    /** Cluster nodes — sizing simulation. */
    cluster?: {
        nodes: RabbitMQClusterNode[];
    } | undefined;
    /** Federation configuration. */
    federation?: {
        upstreams?: RabbitMQFederationUpstream[] | undefined;
        links?: RabbitMQFederationLink[] | undefined;
    } | undefined;
    /** amqp-connection-manager style auto-reconnect config. */
    autoReconnect?: {
        /** Initial retry delay in ms. Defaults to 100. */
        initialDelayMs?: number | undefined;
        /** Max retry delay in ms. Defaults to 1000. */
        maxDelayMs?: number | undefined;
        /** Multiplier applied between retries. Defaults to 2. */
        factor?: number | undefined;
        /** Max attempts before giving up. Defaults to 10. */
        maxAttempts?: number | undefined;
    } | undefined;
}
```
