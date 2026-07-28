---
title: "@kiwa-lab/queue sandbox-queue の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>sandbox-queue</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createSandboxBullMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L46) <code v-pre>packages/queue/src/sandbox-queue.ts</code>

Build a sandbox (offline, in-process) BullMQ-shaped queue. Suitable for unit tests that need to exercise the job lifecycle (add / process / retry / fail / drain) without spinning up a Redis container.

```ts
export declare function createSandboxBullMQEnv(opts: SetupBullMQEnvOptions & {
    queueName: string;
}): BullMQTestEnv<'mock'>;
```


