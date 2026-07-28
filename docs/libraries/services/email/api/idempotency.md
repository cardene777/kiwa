---
title: "@kiwa-lab/email idempotency の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/email</code> <code v-pre>idempotency</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/email/src/idempotency.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createIdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/idempotency.ts#L11) <code v-pre>packages/email/src/idempotency.ts</code>

in-memory idempotency cache (production では Redis 等に差替想定)。

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### <code v-pre>sendIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/idempotency.ts#L32) <code v-pre>packages/email/src/idempotency.ts</code>

idempotent send: 同 idempotencyKey なら cached result を返却、 dup send 防止。 key 未登録なら send して cache に格納。

```ts
export declare function sendIdempotent(client: EmailClient, msg: EmailMessage, options: IdempotentSendOptions): Promise<EmailSendResult & {
    cached: boolean;
}>;
```

### 型

#### <code v-pre>IdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/idempotency.ts#L3) <code v-pre>packages/email/src/idempotency.ts</code>

```ts
export interface IdempotencyCache {
    get: (key: string) => EmailSendResult | undefined;
    set: (key: string, value: EmailSendResult) => void;
    size: () => number;
    clear: () => void;
}
```

#### <code v-pre>IdempotentSendOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/idempotency.ts#L23) <code v-pre>packages/email/src/idempotency.ts</code>

```ts
export interface IdempotentSendOptions {
    cache: IdempotencyCache;
    idempotencyKey: string;
}
```
