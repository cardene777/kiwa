---
title: "@kiwa-lab/queue rabbitmq__stub-rabbitmq の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>rabbitmq&#95;&#95;stub-rabbitmq</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createStubRabbitMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L117) <code v-pre>packages/queue/src/rabbitmq/stub-rabbitmq.ts</code>

Build the stub RabbitMQ env — in-process, deterministic AMQP 0.9.1 model emulation. No docker required.

```ts
export declare function createStubRabbitMQEnv(opts?: SetupRabbitMQEnvOptions): RabbitMQTestEnv<'mock'>;
```


