---
title: "@kiwa-lab/queue rabbitmq__setup-rabbitmq-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>rabbitmq&#95;&#95;setup-rabbitmq-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/setup-rabbitmq-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setupRabbitMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/setup-rabbitmq-env.ts#L19) <code v-pre>packages/queue/src/rabbitmq/setup-rabbitmq-env.ts</code>

Factory for RabbitMQ test environments. `mode: 'stub'` (default) returns a fast, in-process AMQP 0.9.1 model emulator. No docker, no network. Deterministic enough to exercise exchange / queue / binding / consumer / ack / nack / prefetch semantics. `mode: 'testcontainers'` connects to a running RabbitMQ broker (URL provided via `testcontainers.amqpUrl`) and verifies responsiveness via the management API. The env still runs the message simulation in-process (v0.3 scope) so assertions stay deterministic across backends; callers that want to drive the real wire can point their own `amqplib` at the exposed `env.amqpUrl`.

```ts
export declare function setupRabbitMQEnv(opts?: SetupRabbitMQEnvOptions): Promise<RabbitMQTestEnv>;
```


