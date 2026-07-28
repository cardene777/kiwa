---
title: "@kiwa-lab/queue rabbitmq-advanced-setup-rabbitmq-advanced-env の API 契約"
---

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>rabbitmq-advanced-setup-rabbitmq-advanced-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupRabbitMQAdvancedEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L39) <code v-pre>packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts</code>

Build the advanced RabbitMQ test env. Composes over the basic stub adapter (v1.10-3) — the basic env owns exchange / queue / binding / consumer bookkeeping, while this env layers DLX routing, delayed message plugin, cluster simulation, federation, and auto-reconnect.

```ts
export declare function setupRabbitMQAdvancedEnv(opts?: SetupRabbitMQAdvancedEnvOptions): Promise<RabbitMQAdvancedTestEnv<'mock'>>;
```


