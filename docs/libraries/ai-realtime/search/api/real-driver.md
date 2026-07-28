---
title: "@kiwa-lab/search real-driver の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/search</code> <code v-pre>real-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>apiKeyEnvVar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L49) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function apiKeyEnvVar(backend: SearchBackend): string;
```

#### <code v-pre>buildRealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L77) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function buildRealDriverConfig(backend: SearchBackend, overrides?: Partial<Omit<RealDriverConfig, 'backend'>>, env?: NodeJS.ProcessEnv): RealDriverConfig;
```

#### <code v-pre>explicitEnvKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L36) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function explicitEnvKey(backend: SearchBackend): string;
```

#### <code v-pre>isKiwaModeReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L19) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function isKiwaModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>resolveApiKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L62) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function resolveApiKey(backend: SearchBackend, env?: NodeJS.ProcessEnv): string | null;
```

#### <code v-pre>resolveSearchEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L23) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function resolveSearchEndpoint(backend: SearchBackend, env?: NodeJS.ProcessEnv): string;
```

#### <code v-pre>skipUnlessReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L90) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function skipUnlessReal(env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

### 型

#### <code v-pre>RealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L70) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export interface RealDriverConfig {
    backend: SearchBackend;
    endpoint: string;
    apiKey: string | null;
    timeoutMs: number;
}
```

#### <code v-pre>SearchBackend</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L10) <code v-pre>packages/search/src/real-driver.ts</code>

Real driver env-gate for search v0.3. Provides KIWA_MODE=real-based helpers for testing against actual search backends (Meilisearch + Typesense + Algolia + OpenSearch OSS). Consumers gate a describe block on `isKiwaModeReal()`, and use `resolveSearchEndpoint()` to fetch backend URLs. When KIWA_MODE != 'real', tests should skip.

```ts
export type SearchBackend = 'meilisearch' | 'typesense' | 'algolia' | 'opensearch-oss';
```
