---
title: "@kiwa-lab/observability real-driver の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>real-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildRealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L54) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export declare function buildRealDriverConfig(backend: ObservabilityBackend, overrides?: Partial<Omit<RealDriverConfig, 'backend'>>, env?: NodeJS.ProcessEnv): RealDriverConfig;
```

#### <code v-pre>explicitEnvKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L35) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export declare function explicitEnvKey(backend: ObservabilityBackend): string;
```

#### <code v-pre>isKiwaModeReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L19) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export declare function isKiwaModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>resolveObservabilityEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L23) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export declare function resolveObservabilityEndpoint(backend: ObservabilityBackend, env?: NodeJS.ProcessEnv): string;
```

#### <code v-pre>skipUnlessReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L66) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export declare function skipUnlessReal(env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

### 型

#### <code v-pre>ObservabilityBackend</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L10) <code v-pre>packages/observability/src/real-driver.ts</code>

Real driver env-gate for observability v2.1. Provides KIWA_MODE=real-based helpers for testing against actual observability backends (Grafana OSS + Prometheus + Loki + OpenTelemetry Collector). Consumers gate a describe block on `isKiwaModeReal()`, and use `resolveObservabilityEndpoint()` to fetch backend URLs. When KIWA_MODE != 'real', tests should skip.

```ts
export type ObservabilityBackend = 'grafana-oss' | 'prometheus' | 'loki' | 'otel-collector';
```

#### <code v-pre>RealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L48) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export interface RealDriverConfig {
    backend: ObservabilityBackend;
    endpoint: string;
    timeoutMs: number;
}
```
