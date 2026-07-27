# @kiwa-lab/feature-flag リファレンス

フラグ評価とルールの公開 API です。この page では、どの API が flag definition を変えるか、どの API が評価記録や cache を増やすかを確認します。最初の導入は [Quickstart](./quickstart)、rule の優先順と cache の扱いは [使い方](./how-to) を参照してください。

## 評価の入口

`createFlagClient` は flag definition、rule、評価記録を持つ client を作ります。`evaluateFlag` は一つの key を、`evaluateAllFlags` は登録済みの全 key を user に対して評価します。どちらも評価ごとに record を追加します。

`FlagClient.registerRule` は評価順の末尾に rule を追加します。`matchRule` は一つの rule と user を直接評価するときに使いますが、通常は `evaluateFlag` に rule の走査と既定値への fallback を任せます。`providerIdPrefix` と `normalizeProviderConfig` は provider を識別する記録や設定の補助であり、remote config の取得は行いません。

## 設定

`provider` は `growthbook`、`launchdarkly`、`posthog`、`unleash` から選びます。フラグには `key`、`variant`、`defaultValue` を指定します。未登録 flag の評価は boolean false と `flag-not-found` を返します。

## ルールと記録

targeting rule は user id、percentage rule は再現可能な hash bucket、attribute rule は user attributes を評価します。全 rule が一致しなければ default value です。`EvaluateFlagResult` は key、value、reason、評価記録を返します。

`clear` は `listEvaluated` の記録だけを消去します。flag と rule の設定を消す API はありません。

## evaluation helper

`evaluateAllFlags` は登録順の全flagを評価してresult arrayを返します。`evaluateBatch` はentriesのresultと `byKey` を返します。keyが重複するbatchの `byKey` は最後のresultを上書きします。

`evaluateIdempotent` は `(key, user.id)` でcacheし、cache hitではevaluation recordを追加しません。cacheはuser attributesやrule変更をkeyに含めません。

`evaluateWithRetry` はretry resultをthrowせず返します。既定の `isRetryable` はreasonが `error` の場合だけtrueですが、`evaluateFlag` の標準経路はerror reasonを作らないため、既定では一回でreturnします。

`createHookRegistry` と `evaluateObservable`、`createCircuitBreaker` はevaluationの周辺挙動をtestするutilityです。基本の `evaluateFlag` はhook、retry、cache、circuit breakerを自動で使用しません。

## 後始末

外部接続は作りません。テストごとに新しい client を作ります。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `createCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L20) `packages/feature-flag/src/circuit-breaker.ts`

```ts
export declare function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker;
```

#### `createFlagClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L56) `packages/feature-flag/src/client.ts`

provider 別 mock 差 (id prefix / evaluation stream 名) を持たせつつ、 全 API 共通 interface。 実 provider (GrowthBook / LaunchDarkly / PostHog / Unleash) の SDK を差し替えても同じ signature で呼べる想定。

```ts
export declare function createFlagClient(options?: CreateFlagClientOptions): FlagClient;
```

#### `createHookRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L22) `packages/feature-flag/src/observability.ts`

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### `createIdempotencyCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/idempotency.ts#L11) `packages/feature-flag/src/idempotency.ts`

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### `evaluateAllFlags`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L60) `packages/feature-flag/src/evaluator.ts`

全登録 flag を user 1 人に対して bulk evaluate。 SPA/mobile client の起動時に 1 回だけ 全 flag を pre-fetch する pattern を再現。

```ts
export declare function evaluateAllFlags(client: FlagClient, user: FlagUser): EvaluateAllFlagsResult;
```

#### `evaluateBatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/batch.ts#L11) `packages/feature-flag/src/batch.ts`

batch evaluate: 複数 (key, user) pair を一括評価。

```ts
export declare function evaluateBatch(client: FlagClient, entries: readonly {
    key: string;
    user: FlagUser;
}[]): BatchEvaluateResult;
```

#### `evaluateFlag`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L20) `packages/feature-flag/src/evaluator.ts`

flag key + user から value を決定。 rule chain を順次評価し、 最初に matched した rule の value を採用。 全 rule miss / 未登録 flag は defaultValue に fallback。

```ts
export declare function evaluateFlag(client: FlagClient, key: string, user: FlagUser): EvaluateFlagResult;
```

#### `evaluateIdempotent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/idempotency.ts#L22) `packages/feature-flag/src/idempotency.ts`

cached evaluate: 同 (flagKey, user.id) で cached result を返却。

```ts
export declare function evaluateIdempotent(client: FlagClient, key: string, user: FlagUser, cache: IdempotencyCache): EvaluateFlagResult & {
    cached: boolean;
};
```

#### `evaluateObservable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L36) `packages/feature-flag/src/observability.ts`

```ts
export declare function evaluateObservable(client: FlagClient, key: string, user: FlagUser, hooks: HookRegistry): EvaluateFlagResult;
```

#### `evaluateWithRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/retry.ts#L11) `packages/feature-flag/src/retry.ts`

```ts
export declare function evaluateWithRetry(client: FlagClient, key: string, user: FlagUser, options?: RetryOptions): Promise<EvaluateFlagResult & {
    attempts: number;
}>;
```

#### `matchRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L46) `packages/feature-flag/src/rules.ts`

user + rule 評価 = 最初にヒットした rule の value を返す。 全 rule miss で fallback / defaultValue。 percentage は hash(userId + key) % 100 で決定 (再現性)。

```ts
export declare function matchRule(rule: FlagRule, user: FlagUser, key: string): RuleMatchResult;
```

#### `normalizeProviderConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/provider.ts#L25) `packages/feature-flag/src/provider.ts`

provider config を統一 shape に正規化。 実 provider の SDK config 差 (LaunchDarkly = sdkKey, PostHog = apiKey + host, GrowthBook = clientKey, Unleash = url + appName) を吸収。

```ts
export declare function normalizeProviderConfig(config: Partial<ProviderConfig> & {
    provider: FlagProvider;
}): ProviderConfig;
```

#### `providerIdPrefix`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/provider.ts#L14) `packages/feature-flag/src/provider.ts`

provider 別の evaluation record id prefix。 実 provider の event stream / analytics で 使われる prefix を再現し、 mock でも同じ format で id を発行する。

```ts
export declare const providerIdPrefix: Record<FlagProvider, string>;
```

#### `registerRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L36) `packages/feature-flag/src/rules.ts`

rule を registry に登録するための builder。 client 側の rule Map に push される想定。

```ts
export declare function registerRule(rules: Map<string, FlagRule[]>, key: string, rule: FlagRule): void;
```

### 型

#### `AttributeMatchRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L16) `packages/feature-flag/src/rules.ts`

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

#### `BatchEvaluateResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/batch.ts#L4) `packages/feature-flag/src/batch.ts`

```ts
export interface BatchEvaluateResult {
    total: number;
    results: EvaluateFlagResult[];
    byKey: Record<string, EvaluateFlagResult>;
}
```

#### `CircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L13) `packages/feature-flag/src/circuit-breaker.ts`

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    evaluate: (client: FlagClient, key: string, user: FlagUser) => EvaluateFlagResult & {
        circuitState: CircuitState;
    };
    reset: () => void;
    errorCount: () => number;
}
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L6) `packages/feature-flag/src/circuit-breaker.ts`

```ts
export interface CircuitBreakerOptions {
    errorThreshold?: number;
    resetTimeoutMs?: number;
    fallbackValue?: unknown;
    now?: () => number;
}
```

#### `CircuitState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L4) `packages/feature-flag/src/circuit-breaker.ts`

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### `CreateFlagClientOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L44) `packages/feature-flag/src/client.ts`

```ts
export interface CreateFlagClientOptions {
    provider?: FlagProvider;
    flags?: FlagDefinition[];
    now?: () => number;
    idSeed?: number;
}
```

#### `EvalHookEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L4) `packages/feature-flag/src/observability.ts`

```ts
export type EvalHookEvent = 'before-eval' | 'after-eval' | 'error';
```

#### `EvaluateAllFlagsResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L11) `packages/feature-flag/src/evaluator.ts`

```ts
export interface EvaluateAllFlagsResult {
    user: FlagUser;
    results: EvaluateFlagResult[];
}
```

#### `EvaluatedFlagRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L22) `packages/feature-flag/src/client.ts`

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

#### `EvaluateFlagResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L4) `packages/feature-flag/src/evaluator.ts`

```ts
export interface EvaluateFlagResult {
    key: string;
    value: FlagValue;
    reason: string;
    record: EvaluatedFlagRecord;
}
```

#### `FlagClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L33) `packages/feature-flag/src/client.ts`

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

#### `FlagDefinition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L10) `packages/feature-flag/src/client.ts`

```ts
export interface FlagDefinition {
    key: string;
    variant: FlagVariant;
    defaultValue: FlagValue;
    description?: string;
}
```

#### `FlagProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L4) `packages/feature-flag/src/client.ts`

```ts
export type FlagProvider = 'growthbook' | 'launchdarkly' | 'posthog' | 'unleash';
```

#### `FlagRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L25) `packages/feature-flag/src/rules.ts`

```ts
export type FlagRule = TargetingRule | PercentageRolloutRule | AttributeMatchRule;
```

#### `FlagUser`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L17) `packages/feature-flag/src/client.ts`

```ts
export interface FlagUser {
    id: string;
    attributes?: Record<string, string | number | boolean>;
}
```

#### `FlagValue`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L6) `packages/feature-flag/src/client.ts`

```ts
export type FlagValue = boolean | string | number;
```

#### `FlagVariant`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L8) `packages/feature-flag/src/client.ts`

```ts
export type FlagVariant = 'boolean' | 'string' | 'number';
```

#### `HookCallback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L14) `packages/feature-flag/src/observability.ts`

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### `HookContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L6) `packages/feature-flag/src/observability.ts`

```ts
export interface HookContext {
    event: EvalHookEvent;
    key: string;
    user: FlagUser;
    result?: EvaluateFlagResult;
    error?: string;
}
```

#### `HookRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L16) `packages/feature-flag/src/observability.ts`

```ts
export interface HookRegistry {
    register: (event: EvalHookEvent, cb: HookCallback) => () => void;
    emit: (event: EvalHookEvent, ctx: HookContext) => void;
    count: (event: EvalHookEvent) => number;
}
```

#### `IdempotencyCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/idempotency.ts#L4) `packages/feature-flag/src/idempotency.ts`

```ts
export interface IdempotencyCache {
    get: (key: string) => EvaluateFlagResult | undefined;
    set: (key: string, value: EvaluateFlagResult) => void;
    size: () => number;
    clear: () => void;
}
```

#### `PercentageRolloutRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L9) `packages/feature-flag/src/rules.ts`

```ts
export interface PercentageRolloutRule {
    type: 'percentage';
    percentage: number;
    value: FlagValue;
    fallback: FlagValue;
}
```

#### `ProviderConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/provider.ts#L3) `packages/feature-flag/src/provider.ts`

```ts
export interface ProviderConfig {
    provider: FlagProvider;
    apiKey?: string;
    environment?: string;
    clientKey?: string;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/retry.ts#L4) `packages/feature-flag/src/retry.ts`

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    isRetryable?: (result: EvaluateFlagResult) => boolean;
    onRetry?: (attempt: number) => void;
}
```

#### `RuleMatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L27) `packages/feature-flag/src/rules.ts`

```ts
export interface RuleMatchResult {
    matched: boolean;
    value: FlagValue;
    reason: string;
}
```

#### `TargetingRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L3) `packages/feature-flag/src/rules.ts`

```ts
export interface TargetingRule {
    type: 'targeting';
    userIds: string[];
    value: FlagValue;
}
```
<!-- kiwa-public-api:end -->
