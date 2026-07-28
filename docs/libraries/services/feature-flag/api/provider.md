---
title: "@kiwa-lab/feature-flag provider の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/feature-flag</code> <code v-pre>provider</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/provider.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>normalizeProviderConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/provider.ts#L25) <code v-pre>packages/feature-flag/src/provider.ts</code>

provider config を統一 shape に正規化。 実 provider の SDK config 差 (LaunchDarkly = sdkKey, PostHog = apiKey + host, GrowthBook = clientKey, Unleash = url + appName) を吸収。

```ts
export declare function normalizeProviderConfig(config: Partial<ProviderConfig> & {
    provider: FlagProvider;
}): ProviderConfig;
```

#### <code v-pre>providerIdPrefix</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/provider.ts#L14) <code v-pre>packages/feature-flag/src/provider.ts</code>

provider 別の evaluation record id prefix。 実 provider の event stream / analytics で 使われる prefix を再現し、 mock でも同じ format で id を発行する。

```ts
export declare const providerIdPrefix: Record<FlagProvider, string>;
```

### 型

#### <code v-pre>ProviderConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/provider.ts#L3) <code v-pre>packages/feature-flag/src/provider.ts</code>

```ts
export interface ProviderConfig {
    provider: FlagProvider;
    apiKey?: string;
    environment?: string;
    clientKey?: string;
}
```
