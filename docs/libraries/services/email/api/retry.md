---
title: "@kiwa-lab/email retry の API 契約"
---

# <code v-pre>@kiwa-lab/email</code> <code v-pre>retry</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/email/src/retry.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>sendWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/retry.ts#L19) <code v-pre>packages/email/src/retry.ts</code>

send with exponential backoff。 failed status で retry、 maxAttempts 到達で最後の result を返す。 default = maxAttempts 3 / initialDelayMs 100 / backoffMultiplier 2 / maxDelayMs 5000。

```ts
export declare function sendWithRetry(client: EmailClient, msg: EmailMessage, options?: RetryOptions): Promise<RetrySendResult>;
```

### 型

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/retry.ts#L3) <code v-pre>packages/email/src/retry.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, lastError: string) => void;
}
```

#### <code v-pre>RetrySendResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/retry.ts#L11) <code v-pre>packages/email/src/retry.ts</code>

```ts
export interface RetrySendResult extends EmailSendResult {
    attempts: number;
}
```
