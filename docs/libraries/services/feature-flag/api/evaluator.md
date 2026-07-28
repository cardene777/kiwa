---
title: "@kiwa-lab/feature-flag evaluator の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/feature-flag</code> <code v-pre>evaluator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>evaluateAllFlags</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L60) <code v-pre>packages/feature-flag/src/evaluator.ts</code>

全登録 flag を user 1 人に対して bulk evaluate。 SPA/mobile client の起動時に 1 回だけ 全 flag を pre-fetch する pattern を再現。

```ts
export declare function evaluateAllFlags(client: FlagClient, user: FlagUser): EvaluateAllFlagsResult;
```

#### <code v-pre>evaluateFlag</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L20) <code v-pre>packages/feature-flag/src/evaluator.ts</code>

flag key + user から value を決定。 rule chain を順次評価し、 最初に matched した rule の value を採用。 全 rule miss / 未登録 flag は defaultValue に fallback。

```ts
export declare function evaluateFlag(client: FlagClient, key: string, user: FlagUser): EvaluateFlagResult;
```

### 型

#### <code v-pre>EvaluateAllFlagsResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L11) <code v-pre>packages/feature-flag/src/evaluator.ts</code>

```ts
export interface EvaluateAllFlagsResult {
    user: FlagUser;
    results: EvaluateFlagResult[];
}
```

#### <code v-pre>EvaluateFlagResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L4) <code v-pre>packages/feature-flag/src/evaluator.ts</code>

```ts
export interface EvaluateFlagResult {
    key: string;
    value: FlagValue;
    reason: string;
    record: EvaluatedFlagRecord;
}
```
