---
title: "@kiwa-lab/security real-driver の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>real-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>isKiwaModeReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L60) <code v-pre>packages/security/src/real-driver.ts</code>

```ts
export declare function isKiwaModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>REAL&#95;DRIVER&#95;REQUIRED&#95;KEYS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L13) <code v-pre>packages/security/src/real-driver.ts</code>

```ts
export declare const REAL_DRIVER_REQUIRED_KEYS: Record<SecurityProvider, string[]>;
```

#### <code v-pre>resolveEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L89) <code v-pre>packages/security/src/real-driver.ts</code>

provider 別の endpoint / api key を env から解決する。 testcontainers container の host / port 情報を渡す想定。

```ts
export declare function resolveEndpoint(provider: SecurityProvider, env?: NodeJS.ProcessEnv): RealDriverEndpoint;
```

#### <code v-pre>resolveRealtimeDriver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L35) <code v-pre>packages/security/src/real-driver.ts</code>

env の状態から real driver を使うかどうか判定する。 KIWA_MODE=real + provider 別必須 env が揃った時のみ true。

```ts
export declare function resolveRealtimeDriver(input: RealDriverGateInput): RealDriverGateResult;
```

#### <code v-pre>skipUnlessReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L68) <code v-pre>packages/security/src/real-driver.ts</code>

vitest 用 skip helper — describe block を real driver 未該当時に skip する経路の SSOT。 return.skip=true なら describe.skip 相当。

```ts
export declare function skipUnlessReal(provider: SecurityProvider, env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

### 型

#### <code v-pre>RealDriverEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L79) <code v-pre>packages/security/src/real-driver.ts</code>

```ts
export interface RealDriverEndpoint {
    provider: SecurityProvider;
    endpoint: string | null;
    apiKey: string | null;
}
```

#### <code v-pre>RealDriverGateInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L20) <code v-pre>packages/security/src/real-driver.ts</code>

```ts
export interface RealDriverGateInput {
    provider: SecurityProvider;
    env?: NodeJS.ProcessEnv;
}
```

#### <code v-pre>RealDriverGateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L25) <code v-pre>packages/security/src/real-driver.ts</code>

```ts
export interface RealDriverGateResult {
    useRealDriver: boolean;
    missingKeys: string[];
    reason: string;
}
```
