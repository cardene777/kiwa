---
title: "@kiwa-lab/queue setup-bullmq-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>setup-bullmq-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/setup-bullmq-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setupBullMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/setup-bullmq-env.ts#L18) <code v-pre>packages/queue/src/setup-bullmq-env.ts</code>

Factory for BullMQ test environments. `mode: 'sandbox'` (default) returns a fast, in-process fake — no Docker, no peer dependencies required beyond `bullmq`'s type shape via structural duck-typing. Use it for the fast unit-test lane. `mode: 'testcontainers'` boots a real Redis under testcontainers and wires up a real `bullmq.Queue` + `bullmq.Worker`. Use it for the integration lane that needs prod-shape parity.

```ts
export declare function setupBullMQEnv(opts?: SetupBullMQEnvOptions): Promise<BullMQTestEnv>;
```


