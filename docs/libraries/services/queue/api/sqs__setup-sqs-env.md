---
title: "@kiwa-lab/queue sqs__setup-sqs-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>sqs&#95;&#95;setup-sqs-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/setup-sqs-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupSQSEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/setup-sqs-env.ts#L20) <code v-pre>packages/queue/src/sqs/setup-sqs-env.ts</code>

Factory for AWS SQS test environments. `mode: 'stub'` (default) returns a fast, in-process fake — no docker, no network. Deterministic enough to exercise send / receive / delete / batch / visibility timeout / DLQ / FIFO deduplication semantics without spinning up localstack. `mode: 'localstack'` connects to a running LocalStack endpoint (URL provided via `localstack.endpoint`) and verifies responsiveness before returning the env. The env still runs the message simulation in-process (v0.2 scope) so assertions stay deterministic across backends; callers that want to drive the real wire can point their own `@aws-sdk/client-sqs` at the exposed `env.endpoint`.

```ts
export declare function setupSQSEnv(opts?: SetupSQSEnvOptions): Promise<SQSTestEnv>;
```


