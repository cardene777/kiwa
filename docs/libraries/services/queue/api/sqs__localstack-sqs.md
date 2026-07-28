---
title: "@kiwa-lab/queue sqs__localstack-sqs の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>sqs&#95;&#95;localstack-sqs</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/localstack-sqs.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createLocalstackSQSEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/localstack-sqs.ts#L26) <code v-pre>packages/queue/src/sqs/localstack-sqs.ts</code>

Build a LocalStack-backed SQS env. When `opts.localstack?.endpoint` is provided the helper connects directly to that endpoint and verifies responsiveness. Otherwise the helper would spawn a testcontainers LocalStack instance — kept out of the v0.2 scope so callers wanting fully-managed containers can opt in later. The v0.2 wire path shares the stub simulation for message state (so assertion helpers stay deterministic) while surfacing the LocalStack `endpoint` on the env for callers that want to point their own `@aws-sdk/client-sqs` at it.

```ts
export declare function createLocalstackSQSEnv(opts: SetupSQSEnvOptions): Promise<SQSTestEnv<'live'>>;
```


