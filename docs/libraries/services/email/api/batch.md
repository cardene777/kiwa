---
title: "@kiwa-lab/email batch の API 契約"
---

# <code v-pre>@kiwa-lab/email</code> <code v-pre>batch</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/email/src/batch.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>sendBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/batch.ts#L19) <code v-pre>packages/email/src/batch.ts</code>

batch send with limited concurrency。 default concurrency = 5、 stopOnFirstFailure=true で最初の failure で中断。

```ts
export declare function sendBatch(client: EmailClient, messages: readonly EmailMessage[], options?: BatchSendOptions): Promise<BatchSendResult>;
```

### 型

#### <code v-pre>BatchSendOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/batch.ts#L3) <code v-pre>packages/email/src/batch.ts</code>

```ts
export interface BatchSendOptions {
    concurrency?: number;
    stopOnFirstFailure?: boolean;
}
```

#### <code v-pre>BatchSendResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/batch.ts#L8) <code v-pre>packages/email/src/batch.ts</code>

```ts
export interface BatchSendResult {
    total: number;
    succeeded: number;
    failed: number;
    results: EmailSendResult[];
}
```
