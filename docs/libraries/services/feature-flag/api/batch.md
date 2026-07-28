---
title: "@kiwa-lab/feature-flag batch の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/feature-flag</code> <code v-pre>batch</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/batch.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>evaluateBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/batch.ts#L11) <code v-pre>packages/feature-flag/src/batch.ts</code>

batch evaluate: 複数 (key, user) pair を一括評価。

```ts
export declare function evaluateBatch(client: FlagClient, entries: readonly {
    key: string;
    user: FlagUser;
}[]): BatchEvaluateResult;
```

### 型

#### <code v-pre>BatchEvaluateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/batch.ts#L4) <code v-pre>packages/feature-flag/src/batch.ts</code>

```ts
export interface BatchEvaluateResult {
    total: number;
    results: EvaluateFlagResult[];
    byKey: Record<string, EvaluateFlagResult>;
}
```
