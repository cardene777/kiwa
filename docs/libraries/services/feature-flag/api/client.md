---
title: "@kiwa-lab/feature-flag client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/feature-flag</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createFlagClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L56) <code v-pre>packages/feature-flag/src/client.ts</code>

provider 別 mock 差 (id prefix / evaluation stream 名) を持たせつつ、 全 API 共通 interface。 実 provider (GrowthBook / LaunchDarkly / PostHog / Unleash) の SDK を差し替えても同じ signature で呼べる想定。

```ts
export declare function createFlagClient(options?: CreateFlagClientOptions): FlagClient;
```

### 型

#### <code v-pre>CreateFlagClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L44) <code v-pre>packages/feature-flag/src/client.ts</code>

```ts
export interface CreateFlagClientOptions {
    provider?: FlagProvider;
    flags?: FlagDefinition[];
    now?: () => number;
    idSeed?: number;
}
```

#### <code v-pre>EvaluatedFlagRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L22) <code v-pre>packages/feature-flag/src/client.ts</code>

```ts
export interface EvaluatedFlagRecord {
    id: string;
    provider: FlagProvider;
    key: string;
    value: FlagValue;
    variant: FlagVariant;
    user: FlagUser;
    reason: string;
    evaluatedAt: number;
}
```

#### <code v-pre>FlagClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L33) <code v-pre>packages/feature-flag/src/client.ts</code>

```ts
export interface FlagClient {
    provider: FlagProvider;
    registerFlag: (def: FlagDefinition) => void;
    registerRule: (key: string, rule: FlagRule) => void;
    getFlags: () => FlagDefinition[];
    getRules: (key: string) => FlagRule[];
    listEvaluated: () => EvaluatedFlagRecord[];
    recordEvaluation: (rec: Omit<EvaluatedFlagRecord, 'id' | 'evaluatedAt' | 'provider'>) => EvaluatedFlagRecord;
    clear: () => void;
}
```

#### <code v-pre>FlagDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L10) <code v-pre>packages/feature-flag/src/client.ts</code>

```ts
export interface FlagDefinition {
    key: string;
    variant: FlagVariant;
    defaultValue: FlagValue;
    description?: string;
}
```

#### <code v-pre>FlagProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L4) <code v-pre>packages/feature-flag/src/client.ts</code>

```ts
export type FlagProvider = 'growthbook' | 'launchdarkly' | 'posthog' | 'unleash';
```

#### <code v-pre>FlagUser</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L17) <code v-pre>packages/feature-flag/src/client.ts</code>

```ts
export interface FlagUser {
    id: string;
    attributes?: Record<string, string | number | boolean>;
}
```

#### <code v-pre>FlagValue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L6) <code v-pre>packages/feature-flag/src/client.ts</code>

```ts
export type FlagValue = boolean | string | number;
```

#### <code v-pre>FlagVariant</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L8) <code v-pre>packages/feature-flag/src/client.ts</code>

```ts
export type FlagVariant = 'boolean' | 'string' | 'number';
```
