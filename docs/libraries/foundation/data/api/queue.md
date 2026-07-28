---
title: "@kiwa-lab/data queue の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/data</code> <code v-pre>queue</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/data/src/queue.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupQueueEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/queue.ts#L129) <code v-pre>packages/data/src/queue.ts</code>

```ts
export declare function setupQueueEnv<T = unknown>(opts: SetupQueueEnvOptions<T>): Promise<QueueTestEnv<T>>;
```


