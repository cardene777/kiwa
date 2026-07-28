---
title: "@kiwa-lab/queue rabbitmq__testcontainers-rabbitmq の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>rabbitmq&#95;&#95;testcontainers-rabbitmq</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createTestcontainersRabbitMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts#L17) <code v-pre>packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts</code>

Build a testcontainers-backed RabbitMQ env. When `opts.testcontainers?.amqpUrl` is provided the helper connects directly to that URL and verifies responsiveness. Otherwise the helper would spawn a testcontainers RabbitMQ instance — kept out of the v0.3 scope so callers wanting fully-managed containers can opt in later (add the `testcontainers` peer dep + a small container factory). The v0.3 wire path shares the stub simulation for message state (so assertion helpers stay deterministic) while surfacing the `amqpUrl` + `managementUrl` on the env for callers that want to point their own `amqplib` at it.

```ts
export declare function createTestcontainersRabbitMQEnv(opts: SetupRabbitMQEnvOptions): Promise<RabbitMQTestEnv<'live'>>;
```


