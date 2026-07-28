---
title: "@kiwa-lab/queue testcontainers-queue の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>testcontainers-queue</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createTestcontainersBullMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L112) <code v-pre>packages/queue/src/testcontainers-queue.ts</code>

Build a testcontainers-backed BullMQ environment. Requires Docker; the real bullmq + ioredis peers do the heavy lifting so semantic drift from prod is limited to whatever bullmq itself abstracts.

```ts
export declare function createTestcontainersBullMQEnv(opts: SetupBullMQEnvOptions & {
    queueName: string;
}): Promise<BullMQTestEnv<'live'>>;
```


