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
| <code v-pre>rate limit $&#123;options.maxRequests&#125;/$&#123;options.windowMs&#125;ms exceeded</code> | [packages/workflow/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L57) |
| <code v-pre>circuit breaker open</code> | [packages/workflow/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L72) |
| <code v-pre>workflow "$&#123;name&#125;" requires at least one step</code> | [packages/workflow/src/steps.ts](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L23) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>batchOperate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L111) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export declare function batchOperate<TIn, TOut>(items: readonly BatchItem<TIn>[], runner: (item: BatchItem<TIn>) => Promise<TOut>): Promise<BatchResult[]>;
```

#### <code v-pre>createWorkflowClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L48) <code v-pre>packages/workflow/src/client.ts</code>

provider 別のみ id prefix を差別化し、 execute pipeline は共通実装。 実 provider (Temporal SDK / Inngest / Trigger.dev / AWS SFN) の差し替え可能 signature を再現。

```ts
export declare function createWorkflowClient(options?: CreateWorkflowClientOptions): WorkflowClient;
```

#### <code v-pre>defineWorkflow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L22) <code v-pre>packages/workflow/src/steps.ts</code>

```ts
export declare function defineWorkflow(name: string, steps: WorkflowStep[]): WorkflowDefinition;
```

#### <code v-pre>emitEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L59) <code v-pre>packages/workflow/src/events.ts</code>

event を emit して登録済 workflow を全 execute する。 emit 順で workflow 実行が並ぶ。

```ts
export declare function emitEvent(client: WorkflowClient, event: EmittedEvent): Promise<WorkflowExecutionResult[]>;
```

#### <code v-pre>eventDrivenTrigger</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L24) <code v-pre>packages/workflow/src/events.ts</code>

event 名で workflow を trigger 登録する。 event が emit されると同名の workflow が execute される (Inngest event-driven / AWS EventBridge → SFN の挙動を再現)。

```ts
export declare function eventDrivenTrigger(client: WorkflowClient, eventName: string, workflow: WorkflowDefinition): EventTriggerHandle;
```

#### <code v-pre>executeWorkflow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L31) <code v-pre>packages/workflow/src/steps.ts</code>

内部 helper — step 群を順次実行して各 step の output を次 step の previous に渡す。 実 provider (Temporal activity / Inngest step) が step 単位で durable state を保持する挙動を再現。

```ts
export declare function executeWorkflow(workflow: WorkflowDefinition, input: WorkflowInput): Promise<{
    output: WorkflowOutput;
    stepOutputs: WorkflowOutput[];
}>;
```

#### <code v-pre>retryStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/retry.ts#L22) <code v-pre>packages/workflow/src/retry.ts</code>

exponential backoff で fn を retry。 実 provider (Temporal RetryPolicy / Inngest step retry) の指数バックオフ挙動を再現。 delay は `baseDelayMs * 2 ** (attempt-1)`、 maxDelayMs で cap。

```ts
export declare function retryStep<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>withCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L64) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export declare function withCircuitBreaker<T>(fn: () => Promise<T>, options: CircuitBreakerOptions): () => Promise<T>;
```

#### <code v-pre>withIdempotencyKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L101) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export declare function withIdempotencyKey<T>(fn: (key: string) => Promise<T>): (key: string) => Promise<T>;
```

#### <code v-pre>withObservability</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L86) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export declare function withObservability<T>(name: string, fn: () => Promise<T>, hook: ObservabilityHook): () => Promise<T>;
```

#### <code v-pre>withRateLimit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L50) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export declare function withRateLimit<T>(fn: () => Promise<T>, options: RateLimitOptions): () => Promise<T>;
```

#### <code v-pre>withRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L20) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export declare function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): () => Promise<T>;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L40) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): () => Promise<T>;
```

### 型

#### <code v-pre>BatchItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L17) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export interface BatchItem<TIn = unknown> {
    name: string;
    input: TIn;
}
```

#### <code v-pre>BatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L18) <code v-pre>packages/workflow/src/resilience.ts</code>

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

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L11) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetMs: number;
}
```

#### <code v-pre>CreateWorkflowClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L38) <code v-pre>packages/workflow/src/client.ts</code>

```ts
export interface CreateWorkflowClientOptions {
    provider?: WorkflowProvider;
    now?: () => number;
    idSeed?: number;
}
```

#### <code v-pre>EmittedEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L4) <code v-pre>packages/workflow/src/events.ts</code>

```ts
export interface EmittedEvent {
    name: string;
    payload: WorkflowInput;
    emittedAt: number;
}
```

#### <code v-pre>EventTriggerHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L10) <code v-pre>packages/workflow/src/events.ts</code>

```ts
export interface EventTriggerHandle {
    eventName: string;
    workflowName: string;
    handledCount: () => number;
    dispose: () => void;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L12) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export interface ObservabilityHook {
    onStart?: (name: string, input?: unknown) => void;
    onSuccess?: (name: string, output: unknown, durationMs: number) => void;
    onError?: (name: string, err: unknown, durationMs: number) => void;
}
```

#### <code v-pre>RateLimitOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L10) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
}
```

#### <code v-pre>ResilienceRetryOptions</code>

公開 entry point から解決しています。

<code v-pre>RetryOptions</code> を <code v-pre>ResilienceRetryOptions</code> として公開しています。

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

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/retry.ts#L1) <code v-pre>packages/workflow/src/retry.ts</code>

```ts
export interface RetryOptions {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs?: number;
    onAttempt?: (attempt: number, delayMs: number) => void;
    sleep?: (ms: number) => Promise<void>;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/retry.ts#L9) <code v-pre>packages/workflow/src/retry.ts</code>

```ts
export interface RetryResult<T> {
    value?: T;
    attempts: number;
    succeeded: boolean;
    error?: string;
    delaysMs: number[];
}
```

#### <code v-pre>TimeoutOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L9) <code v-pre>packages/workflow/src/resilience.ts</code>

```ts
export interface TimeoutOptions {
    ms: number;
}
```

#### <code v-pre>WorkflowClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L28) <code v-pre>packages/workflow/src/client.ts</code>

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

#### <code v-pre>WorkflowDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L17) <code v-pre>packages/workflow/src/steps.ts</code>

```ts
export interface WorkflowDefinition {
    name: string;
    steps: WorkflowStep[];
}
```

#### <code v-pre>WorkflowExecutionRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L23) <code v-pre>packages/workflow/src/client.ts</code>

```ts
export interface WorkflowExecutionRecord extends WorkflowExecutionResult {
    input: WorkflowInput;
    stepOutputs: WorkflowOutput[];
}
```

#### <code v-pre>WorkflowExecutionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L12) <code v-pre>packages/workflow/src/client.ts</code>

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

#### <code v-pre>WorkflowInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L1) <code v-pre>packages/workflow/src/steps.ts</code>

```ts
export type WorkflowInput = Record<string, unknown>;
```

#### <code v-pre>WorkflowOutput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L2) <code v-pre>packages/workflow/src/steps.ts</code>

```ts
export type WorkflowOutput = Record<string, unknown>;
```

#### <code v-pre>WorkflowProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L10) <code v-pre>packages/workflow/src/client.ts</code>

```ts
export type WorkflowProvider = 'temporal' | 'inngest' | 'trigger' | 'aws-sfn';
```

#### <code v-pre>WorkflowStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L12) <code v-pre>packages/workflow/src/steps.ts</code>

```ts
export interface WorkflowStep {
    name: string;
    run: (ctx: WorkflowStepContext) => Promise<WorkflowOutput> | WorkflowOutput;
}
```

#### <code v-pre>WorkflowStepContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L4) <code v-pre>packages/workflow/src/steps.ts</code>

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
