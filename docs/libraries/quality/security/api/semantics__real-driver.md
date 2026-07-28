---
title: "@kiwa-lab/security semantics__real-driver の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>semantics&#95;&#95;real-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>ADV&#95;API&#95;KEY&#95;ENV&#95;KEY</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L24) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare const ADV_API_KEY_ENV_KEY: Record<SecurityAdvTarget, string>;
```

#### <code v-pre>ADV&#95;ENDPOINT&#95;ENV&#95;KEY</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L17) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare const ADV_ENDPOINT_ENV_KEY: Record<SecurityAdvTarget, string>;
```

#### <code v-pre>ADV&#95;REQUIRED&#95;KEYS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L31) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare const ADV_REQUIRED_KEYS: Record<SecurityAdvTarget, string[]>;
```

#### <code v-pre>buildAdvRealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L101) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function buildAdvRealDriverConfig(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): AdvRealDriverConfig;
```

#### <code v-pre>isKiwaAdvModeReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L13) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function isKiwaAdvModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>resolveAdvApiKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L85) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function resolveAdvApiKey(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): string | null;
```

#### <code v-pre>resolveAdvEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L76) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function resolveAdvEndpoint(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): string | null;
```

#### <code v-pre>resolveAdvRealDriver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L49) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function resolveAdvRealDriver(input: AdvRealDriverGateInput): AdvRealDriverGateResult;
```

#### <code v-pre>skipUnlessAdvReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L113) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function skipUnlessAdvReal(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

### 型

#### <code v-pre>AdvRealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L94) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export interface AdvRealDriverConfig {
    provider: SecurityAdvTarget;
    endpoint: string | null;
    apiKey: string | null;
    timeoutMs: number;
}
```

#### <code v-pre>AdvRealDriverGateInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L38) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export interface AdvRealDriverGateInput {
    provider: SecurityAdvTarget;
    env?: NodeJS.ProcessEnv;
}
```

#### <code v-pre>AdvRealDriverGateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L43) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export interface AdvRealDriverGateResult {
    useRealDriver: boolean;
    missingKeys: string[];
    reason: string;
}
```
