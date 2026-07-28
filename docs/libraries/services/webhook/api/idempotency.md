---
title: "@kiwa-lab/webhook idempotency の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/webhook</code> <code v-pre>idempotency</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/idempotency.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createIdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/idempotency.ts#L10) <code v-pre>packages/webhook/src/idempotency.ts</code>

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### <code v-pre>verifyIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/idempotency.ts#L21) <code v-pre>packages/webhook/src/idempotency.ts</code>

idempotent verify: event id (or dedup key) で dup detection、 cached outcome 返却。

```ts
export declare function verifyIdempotent(verifier: WebhookVerifier, incoming: IncomingWebhook, idempotencyKey: string, cache: IdempotencyCache): WebhookVerifyOutcome & {
    deduplicated: boolean;
};
```

### 型

#### <code v-pre>IdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/idempotency.ts#L3) <code v-pre>packages/webhook/src/idempotency.ts</code>

```ts
export interface IdempotencyCache {
    seen: (key: string) => boolean;
    mark: (key: string, outcome: WebhookVerifyOutcome) => void;
    get: (key: string) => WebhookVerifyOutcome | undefined;
    clear: () => void;
}
```
