---
title: "@kiwa-lab/workflow retry の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/workflow</code> <code v-pre>retry</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/retry.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>retryStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/retry.ts#L22) <code v-pre>packages/workflow/src/retry.ts</code>

exponential backoff で fn を retry。 実 provider (Temporal RetryPolicy / Inngest step retry) の指数バックオフ挙動を再現。 delay は `baseDelayMs * 2 ** (attempt-1)`、 maxDelayMs で cap。

```ts
export declare function retryStep<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions): Promise<RetryResult<T>>;
```

### 型

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/retry.ts#L1) <code v-pre>packages/workflow/src/retry.ts</code>

```ts
export interface RetryOptions {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs?: number;
    onAttempt?: (attempt: number, delayMs: number) => void;
    sleep?: (ms: number) => Promise<void>;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/retry.ts#L9) <code v-pre>packages/workflow/src/retry.ts</code>

```ts
export interface RetryResult<T> {
    value?: T;
    attempts: number;
    succeeded: boolean;
    error?: string;
    delaysMs: number[];
}
```
