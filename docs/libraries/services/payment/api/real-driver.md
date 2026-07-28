---
title: "@kiwa-lab/payment real-driver の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>real-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>assertMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L74) <code v-pre>packages/payment/src/real-driver.ts</code>

Assert that a provider is in a specific mode. Used by dogfood apps that expect real driver mode in CI + fail loudly if the env is not configured.

```ts
export declare function assertMode(provider: PaymentProvider, expected: PaymentMode, env?: Record<string, string | undefined>): void;
```

#### <code v-pre>resolveAllModes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L62) <code v-pre>packages/payment/src/real-driver.ts</code>

Convenience — resolve modes for all 3 providers in one pass. Used by release-gate + fidelity harness to report which combinations are live.

```ts
export declare function resolveAllModes(env?: Record<string, string | undefined>): ResolvedMode[];
```

#### <code v-pre>resolveMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L39) <code v-pre>packages/payment/src/real-driver.ts</code>

Resolve the effective mode for a provider given a live env snapshot. `env` defaults to `process.env` so callers can inject a synthetic env for unit tests.

```ts
export declare function resolveMode(provider: PaymentProvider, env?: Record<string, string | undefined>): ResolvedMode;
```

### 型

#### <code v-pre>PaymentMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L20) <code v-pre>packages/payment/src/real-driver.ts</code>

Real-driver env-gate — inspects `process.env` to decide whether the

```ts
export type PaymentMode = 'mock' | 'real';
```

#### <code v-pre>ResolvedMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/real-driver.ts#L22) <code v-pre>packages/payment/src/real-driver.ts</code>

```ts
export interface ResolvedMode {
    mode: PaymentMode;
    provider: PaymentProvider;
    reason: 'default-mock' | 'kiwa-mode-real' | 'missing-key' | 'invalid-mode';
}
```
