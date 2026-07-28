---
title: "@kiwa-lab/feature-flag idempotency の API 契約"
---

# <code v-pre>@kiwa-lab/feature-flag</code> <code v-pre>idempotency</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/idempotency.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createIdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/idempotency.ts#L11) <code v-pre>packages/feature-flag/src/idempotency.ts</code>

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### <code v-pre>evaluateIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/idempotency.ts#L22) <code v-pre>packages/feature-flag/src/idempotency.ts</code>

cached evaluate: 同 (flagKey, user.id) で cached result を返却。

```ts
export declare function evaluateIdempotent(client: FlagClient, key: string, user: FlagUser, cache: IdempotencyCache): EvaluateFlagResult & {
    cached: boolean;
};
```

### 型

#### <code v-pre>IdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/idempotency.ts#L4) <code v-pre>packages/feature-flag/src/idempotency.ts</code>

```ts
export interface IdempotencyCache {
    get: (key: string) => EvaluateFlagResult | undefined;
    set: (key: string, value: EvaluateFlagResult) => void;
    size: () => number;
    clear: () => void;
}
```
