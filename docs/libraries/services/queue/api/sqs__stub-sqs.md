---
title: "@kiwa-lab/queue sqs__stub-sqs の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>sqs&#95;&#95;stub-sqs</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createStubSQSEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L63) <code v-pre>packages/queue/src/sqs/stub-sqs.ts</code>

Build an in-process stub of AWS SQS covering the message lifecycle observed by production consumers — `send` / `receive` / `delete` / batch / visibility timeout / DLQ / FIFO deduplication — deterministically, without spinning up localstack.

```ts
export declare function createStubSQSEnv(opts: SetupSQSEnvOptions): SQSTestEnv<'mock'>;
```


