# @kiwa-lab/workflow リファレンス

## client

`createWorkflowClient(options)` は in-memory の `WorkflowClient` を返します。`provider` の既定値は `temporal` です。`idSeed` を指定すると execution id の連番を固定でき、`now` で記録する時刻を制御できます。

| provider | execution id の prefix |
| --- | --- |
| `temporal` | `wf-` |
| `inngest` | `ing-` |
| `trigger` | `trg-` |
| `aws-sfn` | `sfn-` |

`register` は同じ name の workflow を置き換えます。`registered` は登録済みの定義、`listExecutions` は実行履歴のコピーを返します。`clear` は登録済み workflow と履歴を消去します。通常は client をテストごとに作るほうが、状態が明確です。

## workflow と step

`defineWorkflow(name, steps)` は `WorkflowDefinition` を作ります。step が空なら例外になります。各 `WorkflowStep` は次の context を受け取ります。

| field | 内容 |
| --- | --- |
| `workflowName` | 実行中の workflow 名 |
| `stepIndex` | 定義順のゼロ始まり index |
| `attempt` | 現在の実装では常に一 |
| `input` | `execute` に渡した input |
| `previous` | 直前の step の output |

`executeWorkflow` は client を使わず step 列を実行し、最後の `output` と各 step の `stepOutputs` を返します。`client.execute` は同じ処理を実行して、id、provider、開始と完了の時刻、`completed` または `failed` の status を付けます。

## retry

`retryStep(fn, options)` の `fn` は現在の attempt 番号を受け取ります。`options` では `maxAttempts` と `baseDelayMs` が必須です。待機時間は `baseDelayMs`、その二倍、さらに二倍と増え、`maxDelayMs` があれば上限になります。

`onAttempt` は失敗後の attempt と次の delay を受け取ります。`sleep` を指定すると待機を差し替えられます。結果には `value`、`attempts`、`succeeded`、`error`、`delaysMs` が含まれます。

## event

`eventDrivenTrigger(client, eventName, workflow)` は event と workflow を結び、`EventTriggerHandle` を返します。handle の `handledCount` で実行回数を取得し、`dispose` で登録を解除します。

`emitEvent(client, event)` は `EmittedEvent` の `name` と `payload` に一致する workflow を順番に実行し、`WorkflowExecutionResult[]` を返します。`emittedAt` は event の記録用フィールドです。

## resilience helper

`withRetry`、`withTimeout`、`withRateLimit`、`withCircuitBreaker`、`withObservability`、`withIdempotencyKey` は Promise を返す関数を包みます。`batchOperate` は item ごとの成功または失敗を `BatchResult[]` として返します。これらは状態を保持する helper もあるため、テストごとに新しく生成してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `rate limit ${options.maxRequests}/${options.windowMs}ms exceeded` | [packages/workflow/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L57) |
| 'circuit breaker open' | [packages/workflow/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L72) |
| `workflow "${name}" requires at least one step` | [packages/workflow/src/steps.ts](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L23) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `batchOperate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L111) `packages/workflow/src/resilience.ts`

```ts
export declare function batchOperate<TIn, TOut>(items: readonly BatchItem<TIn>[], runner: (item: BatchItem<TIn>) => Promise<TOut>): Promise<BatchResult[]>;
```

#### `createWorkflowClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L48) `packages/workflow/src/client.ts`

provider 別のみ id prefix を差別化し、 execute pipeline は共通実装。 実 provider (Temporal SDK / Inngest / Trigger.dev / AWS SFN) の差し替え可能 signature を再現。

```ts
export declare function createWorkflowClient(options?: CreateWorkflowClientOptions): WorkflowClient;
```

#### `defineWorkflow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L22) `packages/workflow/src/steps.ts`

```ts
export declare function defineWorkflow(name: string, steps: WorkflowStep[]): WorkflowDefinition;
```

#### `emitEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L59) `packages/workflow/src/events.ts`

event を emit して登録済 workflow を全 execute する。 emit 順で workflow 実行が並ぶ。

```ts
export declare function emitEvent(client: WorkflowClient, event: EmittedEvent): Promise<WorkflowExecutionResult[]>;
```

#### `eventDrivenTrigger`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L24) `packages/workflow/src/events.ts`

event 名で workflow を trigger 登録する。 event が emit されると同名の workflow が execute される (Inngest event-driven / AWS EventBridge → SFN の挙動を再現)。

```ts
export declare function eventDrivenTrigger(client: WorkflowClient, eventName: string, workflow: WorkflowDefinition): EventTriggerHandle;
```

#### `executeWorkflow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L31) `packages/workflow/src/steps.ts`

内部 helper — step 群を順次実行して各 step の output を次 step の previous に渡す。 実 provider (Temporal activity / Inngest step) が step 単位で durable state を保持する挙動を再現。

```ts
export declare function executeWorkflow(workflow: WorkflowDefinition, input: WorkflowInput): Promise<{
    output: WorkflowOutput;
    stepOutputs: WorkflowOutput[];
}>;
```

#### `retryStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/retry.ts#L22) `packages/workflow/src/retry.ts`

exponential backoff で fn を retry。 実 provider (Temporal RetryPolicy / Inngest step retry) の指数バックオフ挙動を再現。 delay は `baseDelayMs * 2 ** (attempt-1)`、 maxDelayMs で cap。

```ts
export declare function retryStep<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions): Promise<RetryResult<T>>;
```

#### `withCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L64) `packages/workflow/src/resilience.ts`

```ts
export declare function withCircuitBreaker<T>(fn: () => Promise<T>, options: CircuitBreakerOptions): () => Promise<T>;
```

#### `withIdempotencyKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L101) `packages/workflow/src/resilience.ts`

```ts
export declare function withIdempotencyKey<T>(fn: (key: string) => Promise<T>): (key: string) => Promise<T>;
```

#### `withObservability`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L86) `packages/workflow/src/resilience.ts`

```ts
export declare function withObservability<T>(name: string, fn: () => Promise<T>, hook: ObservabilityHook): () => Promise<T>;
```

#### `withRateLimit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L50) `packages/workflow/src/resilience.ts`

```ts
export declare function withRateLimit<T>(fn: () => Promise<T>, options: RateLimitOptions): () => Promise<T>;
```

#### `withRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L20) `packages/workflow/src/resilience.ts`

```ts
export declare function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): () => Promise<T>;
```

#### `withTimeout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L40) `packages/workflow/src/resilience.ts`

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): () => Promise<T>;
```

### 型

#### `BatchItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L17) `packages/workflow/src/resilience.ts`

```ts
export interface BatchItem<TIn = unknown> {
    name: string;
    input: TIn;
}
```

#### `BatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L18) `packages/workflow/src/resilience.ts`

```ts
export interface BatchResult {
    ok: boolean;
    output?: unknown;
    error?: {
        code: string;
        message: string;
    };
}
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L11) `packages/workflow/src/resilience.ts`

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetMs: number;
}
```

#### `CreateWorkflowClientOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L38) `packages/workflow/src/client.ts`

```ts
export interface CreateWorkflowClientOptions {
    provider?: WorkflowProvider;
    now?: () => number;
    idSeed?: number;
}
```

#### `EmittedEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L4) `packages/workflow/src/events.ts`

```ts
export interface EmittedEvent {
    name: string;
    payload: WorkflowInput;
    emittedAt: number;
}
```

#### `EventTriggerHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L10) `packages/workflow/src/events.ts`

```ts
export interface EventTriggerHandle {
    eventName: string;
    workflowName: string;
    handledCount: () => number;
    dispose: () => void;
}
```

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L12) `packages/workflow/src/resilience.ts`

```ts
export interface ObservabilityHook {
    onStart?: (name: string, input?: unknown) => void;
    onSuccess?: (name: string, output: unknown, durationMs: number) => void;
    onError?: (name: string, err: unknown, durationMs: number) => void;
}
```

#### `RateLimitOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L10) `packages/workflow/src/resilience.ts`

```ts
export interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
}
```

#### `ResilienceRetryOptions`

公開 entry point から解決しています。

`RetryOptions` を `ResilienceRetryOptions` として公開しています。

```ts
export {
  withRetry,
  withTimeout,
  withRateLimit,
  withCircuitBreaker,
  withObservability,
  withIdempotencyKey,
  batchOperate,
  type RetryOptions as ResilienceRetryOptions,
  type TimeoutOptions,
  type RateLimitOptions,
  type CircuitBreakerOptions,
  type ObservabilityHook,
  type BatchItem,
  type BatchResult,
} from './resilience.js';
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/retry.ts#L1) `packages/workflow/src/retry.ts`

```ts
export interface RetryOptions {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs?: number;
    onAttempt?: (attempt: number, delayMs: number) => void;
    sleep?: (ms: number) => Promise<void>;
}
```

#### `RetryResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/retry.ts#L9) `packages/workflow/src/retry.ts`

```ts
export interface RetryResult<T> {
    value?: T;
    attempts: number;
    succeeded: boolean;
    error?: string;
    delaysMs: number[];
}
```

#### `TimeoutOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L9) `packages/workflow/src/resilience.ts`

```ts
export interface TimeoutOptions {
    ms: number;
}
```

#### `WorkflowClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L28) `packages/workflow/src/client.ts`

```ts
export interface WorkflowClient {
    provider: WorkflowProvider;
    register: (workflow: WorkflowDefinition) => void;
    registered: () => WorkflowDefinition[];
    execute: (workflowName: string, input: WorkflowInput) => Promise<WorkflowExecutionResult>;
    listExecutions: () => WorkflowExecutionRecord[];
    clear: () => void;
    defineWorkflow: (name: string, steps: WorkflowStep[]) => WorkflowDefinition;
}
```

#### `WorkflowDefinition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L17) `packages/workflow/src/steps.ts`

```ts
export interface WorkflowDefinition {
    name: string;
    steps: WorkflowStep[];
}
```

#### `WorkflowExecutionRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L23) `packages/workflow/src/client.ts`

```ts
export interface WorkflowExecutionRecord extends WorkflowExecutionResult {
    input: WorkflowInput;
    stepOutputs: WorkflowOutput[];
}
```

#### `WorkflowExecutionResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L12) `packages/workflow/src/client.ts`

```ts
export interface WorkflowExecutionResult {
    id: string;
    provider: WorkflowProvider;
    workflow: string;
    status: 'running' | 'completed' | 'failed';
    startedAt: number;
    completedAt: number;
    output?: WorkflowOutput;
    error?: string;
}
```

#### `WorkflowInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L1) `packages/workflow/src/steps.ts`

```ts
export type WorkflowInput = Record<string, unknown>;
```

#### `WorkflowOutput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L2) `packages/workflow/src/steps.ts`

```ts
export type WorkflowOutput = Record<string, unknown>;
```

#### `WorkflowProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L10) `packages/workflow/src/client.ts`

```ts
export type WorkflowProvider = 'temporal' | 'inngest' | 'trigger' | 'aws-sfn';
```

#### `WorkflowStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L12) `packages/workflow/src/steps.ts`

```ts
export interface WorkflowStep {
    name: string;
    run: (ctx: WorkflowStepContext) => Promise<WorkflowOutput> | WorkflowOutput;
}
```

#### `WorkflowStepContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L4) `packages/workflow/src/steps.ts`

```ts
export interface WorkflowStepContext {
    workflowName: string;
    stepIndex: number;
    attempt: number;
    input: WorkflowInput;
    previous: WorkflowOutput;
}
```
<!-- kiwa-public-api:end -->
