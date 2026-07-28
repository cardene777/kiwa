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

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L20) <code v-pre>packages/feature-flag/src/circuit-breaker.ts</code>

```ts
export declare function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createFlagClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/client.ts#L56) <code v-pre>packages/feature-flag/src/client.ts</code>

provider 別 mock 差 (id prefix / evaluation stream 名) を持たせつつ、 全 API 共通 interface。 実 provider (GrowthBook / LaunchDarkly / PostHog / Unleash) の SDK を差し替えても同じ signature で呼べる想定。

```ts
export declare function createFlagClient(options?: CreateFlagClientOptions): FlagClient;
```

#### <code v-pre>createHookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L22) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### <code v-pre>createIdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/idempotency.ts#L11) <code v-pre>packages/feature-flag/src/idempotency.ts</code>

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### <code v-pre>evaluateAllFlags</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L60) <code v-pre>packages/feature-flag/src/evaluator.ts</code>

全登録 flag を user 1 人に対して bulk evaluate。 SPA/mobile client の起動時に 1 回だけ 全 flag を pre-fetch する pattern を再現。

```ts
export declare function evaluateAllFlags(client: FlagClient, user: FlagUser): EvaluateAllFlagsResult;
```

#### <code v-pre>evaluateBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/batch.ts#L11) <code v-pre>packages/feature-flag/src/batch.ts</code>

batch evaluate: 複数 (key, user) pair を一括評価。

```ts
export declare function evaluateBatch(client: FlagClient, entries: readonly {
    key: string;
    user: FlagUser;
}[]): BatchEvaluateResult;
```

#### <code v-pre>evaluateFlag</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L20) <code v-pre>packages/feature-flag/src/evaluator.ts</code>

flag key + user から value を決定。 rule chain を順次評価し、 最初に matched した rule の value を採用。 全 rule miss / 未登録 flag は defaultValue に fallback。

```ts
export declare function evaluateFlag(client: FlagClient, key: string, user: FlagUser): EvaluateFlagResult;
```

#### <code v-pre>evaluateIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/idempotency.ts#L22) <code v-pre>packages/feature-flag/src/idempotency.ts</code>

cached evaluate: 同 (flagKey, user.id) で cached result を返却。

```ts
export declare function evaluateIdempotent(client: FlagClient, key: string, user: FlagUser, cache: IdempotencyCache): EvaluateFlagResult & {
    cached: boolean;
};
```

#### <code v-pre>evaluateObservable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L36) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export declare function evaluateObservable(client: FlagClient, key: string, user: FlagUser, hooks: HookRegistry): EvaluateFlagResult;
```

#### <code v-pre>evaluateWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/retry.ts#L11) <code v-pre>packages/feature-flag/src/retry.ts</code>

```ts
export declare function evaluateWithRetry(client: FlagClient, key: string, user: FlagUser, options?: RetryOptions): Promise<EvaluateFlagResult & {
    attempts: number;
}>;
```

#### <code v-pre>matchRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L46) <code v-pre>packages/feature-flag/src/rules.ts</code>

user + rule 評価 = 最初にヒットした rule の value を返す。 全 rule miss で fallback / defaultValue。 percentage は hash(userId + key) % 100 で決定 (再現性)。

```ts
export declare function matchRule(rule: FlagRule, user: FlagUser, key: string): RuleMatchResult;
```

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

#### <code v-pre>BatchEvaluateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/batch.ts#L4) <code v-pre>packages/feature-flag/src/batch.ts</code>

```ts
export interface BatchEvaluateResult {
    total: number;
    results: EvaluateFlagResult[];
    byKey: Record<string, EvaluateFlagResult>;
}
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L13) <code v-pre>packages/feature-flag/src/circuit-breaker.ts</code>

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

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L6) <code v-pre>packages/feature-flag/src/circuit-breaker.ts</code>

```ts
export interface CircuitBreakerOptions {
    errorThreshold?: number;
    resetTimeoutMs?: number;
    fallbackValue?: unknown;
    now?: () => number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L4) <code v-pre>packages/feature-flag/src/circuit-breaker.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

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

#### <code v-pre>EvalHookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L4) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export type EvalHookEvent = 'before-eval' | 'after-eval' | 'error';
```

#### <code v-pre>EvaluateAllFlagsResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L11) <code v-pre>packages/feature-flag/src/evaluator.ts</code>

```ts
export interface EvaluateAllFlagsResult {
    user: FlagUser;
    results: EvaluateFlagResult[];
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

#### <code v-pre>EvaluateFlagResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/evaluator.ts#L4) <code v-pre>packages/feature-flag/src/evaluator.ts</code>

```ts
export interface EvaluateFlagResult {
    key: string;
    value: FlagValue;
    reason: string;
    record: EvaluatedFlagRecord;
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

#### <code v-pre>FlagRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/rules.ts#L25) <code v-pre>packages/feature-flag/src/rules.ts</code>

```ts
export type FlagRule = TargetingRule | PercentageRolloutRule | AttributeMatchRule;
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

#### <code v-pre>HookCallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L14) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### <code v-pre>HookContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L6) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export interface HookContext {
    event: EvalHookEvent;
    key: string;
    user: FlagUser;
    result?: EvaluateFlagResult;
    error?: string;
}
```

#### <code v-pre>HookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L16) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export interface HookRegistry {
    register: (event: EvalHookEvent, cb: HookCallback) => () => void;
    emit: (event: EvalHookEvent, ctx: HookContext) => void;
    count: (event: EvalHookEvent) => number;
}
```

#### <code v-pre>IdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/idempotency.ts#L4) <code v-pre>packages/feature-flag/src/idempotency.ts</code>

```ts
export interface IdempotencyCache {
    get: (key: string) => EvaluateFlagResult | undefined;
    set: (key: string, value: EvaluateFlagResult) => void;
    size: () => number;
    clear: () => void;
}
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

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/retry.ts#L4) <code v-pre>packages/feature-flag/src/retry.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    isRetryable?: (result: EvaluateFlagResult) => boolean;
    onRetry?: (attempt: number) => void;
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
<!-- kiwa-public-api:end -->
