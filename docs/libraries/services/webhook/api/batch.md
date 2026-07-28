---
title: "@kiwa-lab/webhook batch の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/webhook</code> <code v-pre>batch</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/batch.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>verifyBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/batch.ts#L15) <code v-pre>packages/webhook/src/batch.ts</code>

batch verify: 複数 incoming webhook を一括 verify、 stopOnFirstRejection で中断。

```ts
export declare function verifyBatch(verifier: WebhookVerifier, incomings: readonly IncomingWebhook[], options?: BatchVerifyOptions): BatchVerifyResult;
```

### 型

#### <code v-pre>BatchVerifyOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/batch.ts#L3) <code v-pre>packages/webhook/src/batch.ts</code>

```ts
export interface BatchVerifyOptions {
    stopOnFirstRejection?: boolean;
}
```

#### <code v-pre>BatchVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/batch.ts#L7) <code v-pre>packages/webhook/src/batch.ts</code>

```ts
export interface BatchVerifyResult {
    total: number;
    verified: number;
    rejected: number;
    results: WebhookVerifyOutcome[];
}
```
