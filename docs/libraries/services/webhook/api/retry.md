---
title: "@kiwa-lab/webhook retry の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/webhook</code> <code v-pre>retry</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/retry.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>verifyWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/retry.ts#L15) <code v-pre>packages/webhook/src/retry.ts</code>

verify with exponential backoff (transient signature failure retry)。

```ts
export declare function verifyWithRetry(verifier: WebhookVerifier, incoming: IncomingWebhook, options?: RetryOptions): Promise<RetryVerifyResult>;
```

### 型

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/retry.ts#L3) <code v-pre>packages/webhook/src/retry.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, reason: string) => void;
}
```

#### <code v-pre>RetryVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/retry.ts#L10) <code v-pre>packages/webhook/src/retry.ts</code>

```ts
export interface RetryVerifyResult extends WebhookVerifyOutcome {
    attempts: number;
}
```
