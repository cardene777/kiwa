---
title: "@kiwa-lab/feature-flag retry の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/feature-flag</code> <code v-pre>retry</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/retry.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>evaluateWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/retry.ts#L11) <code v-pre>packages/feature-flag/src/retry.ts</code>

```ts
export declare function evaluateWithRetry(client: FlagClient, key: string, user: FlagUser, options?: RetryOptions): Promise<EvaluateFlagResult & {
    attempts: number;
}>;
```

### 型

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/retry.ts#L4) <code v-pre>packages/feature-flag/src/retry.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    isRetryable?: (result: EvaluateFlagResult) => boolean;
    onRetry?: (attempt: number) => void;
}
```
