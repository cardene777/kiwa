---
title: "@kiwa-lab/ai-llm semantics__real-driver の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics&#95;&#95;real-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>apiKeyEnvVar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L48) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function apiKeyEnvVar(backend: LlmBackend): string;
```

#### <code v-pre>buildRealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L120) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function buildRealDriverConfig(backend: LlmBackend, overrides?: Partial<Omit<RealDriverConfig, 'backend'>>, env?: NodeJS.ProcessEnv): RealDriverConfig;
```

#### <code v-pre>chargeBudget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L87) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function chargeBudget(guard: BudgetGuardConfig, costUsd: number): {
    allowed: boolean;
    reason: string;
    remaining: number;
};
```

#### <code v-pre>endpointEnvKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L35) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function endpointEnvKey(backend: LlmBackend): string;
```

#### <code v-pre>isKiwaModeReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L15) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function isKiwaModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>resolveApiKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L61) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function resolveApiKey(backend: LlmBackend, env?: NodeJS.ProcessEnv): string | null;
```

#### <code v-pre>resolveBudgetGuard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L75) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function resolveBudgetGuard(env?: NodeJS.ProcessEnv): BudgetGuardConfig;
```

#### <code v-pre>resolveLlmEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L26) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function resolveLlmEndpoint(backend: LlmBackend, env?: NodeJS.ProcessEnv): string;
```

#### <code v-pre>skipUnlessReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L134) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export declare function skipUnlessReal(env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

### 型

#### <code v-pre>BudgetGuardConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L69) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export interface BudgetGuardConfig {
    limitUsd: number;
    spentUsd: number;
    perCallCapUsd: number;
}
```

#### <code v-pre>LlmBackend</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L13) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

Real driver env-gate for ai-llm v0.4. Provides KIWA_MODE=real-based helpers for testing against actual LLM backends (Anthropic Messages API + OpenAI Chat Completions + Vercel AI SDK + LangChain). Consumers gate a describe block on `isKiwaModeReal()`, and use `resolveLlmEndpoint()` + `resolveApiKey()` to fetch backend URLs / keys. When KIWA_MODE != 'real', tests should skip. Budget guard は必須。 KIWA_LLM_BUDGET_USD で $ 上限を強制する SSOT。

```ts
export type LlmBackend = 'anthropic' | 'openai' | 'vercel-ai' | 'langchain';
```

#### <code v-pre>RealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/real-driver.ts#L112) <code v-pre>packages/ai-llm/src/semantics/real-driver.ts</code>

```ts
export interface RealDriverConfig {
    backend: LlmBackend;
    endpoint: string;
    apiKey: string | null;
    timeoutMs: number;
    budget: BudgetGuardConfig;
}
```
