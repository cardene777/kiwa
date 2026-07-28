---
title: "@kiwa-lab/feature-flag rules の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/feature-flag</code> <code v-pre>rules</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>matchRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L46) <code v-pre>packages/feature-flag/src/rules.ts</code>

user + rule 評価 = 最初にヒットした rule の value を返す。 全 rule miss で fallback / defaultValue。 percentage は hash(userId + key) % 100 で決定 (再現性)。

```ts
export declare function matchRule(rule: FlagRule, user: FlagUser, key: string): RuleMatchResult;
```

#### <code v-pre>registerRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L36) <code v-pre>packages/feature-flag/src/rules.ts</code>

rule を registry に登録するための builder。 client 側の rule Map に push される想定。

```ts
export declare function registerRule(rules: Map<string, FlagRule[]>, key: string, rule: FlagRule): void;
```

### 型

#### <code v-pre>AttributeMatchRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L16) <code v-pre>packages/feature-flag/src/rules.ts</code>

```ts
export interface AttributeMatchRule {
    type: 'attribute';
    attribute: string;
    operator: 'eq' | 'ne' | 'in' | 'gt' | 'lt';
    value: string | number | boolean | string[];
    matchValue: FlagValue;
    fallback: FlagValue;
}
```

#### <code v-pre>FlagRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L25) <code v-pre>packages/feature-flag/src/rules.ts</code>

```ts
export type FlagRule = TargetingRule | PercentageRolloutRule | AttributeMatchRule;
```

#### <code v-pre>PercentageRolloutRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L9) <code v-pre>packages/feature-flag/src/rules.ts</code>

```ts
export interface PercentageRolloutRule {
    type: 'percentage';
    percentage: number;
    value: FlagValue;
    fallback: FlagValue;
}
```

#### <code v-pre>RuleMatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L27) <code v-pre>packages/feature-flag/src/rules.ts</code>

```ts
export interface RuleMatchResult {
    matched: boolean;
    value: FlagValue;
    reason: string;
}
```

#### <code v-pre>TargetingRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L3) <code v-pre>packages/feature-flag/src/rules.ts</code>

```ts
export interface TargetingRule {
    type: 'targeting';
    userIds: string[];
    value: FlagValue;
}
```
