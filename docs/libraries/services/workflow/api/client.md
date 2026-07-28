---
title: "@kiwa-lab/workflow client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/workflow</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createWorkflowClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L48) <code v-pre>packages/workflow/src/client.ts</code>

provider 別のみ id prefix を差別化し、 execute pipeline は共通実装。 実 provider (Temporal SDK / Inngest / Trigger.dev / AWS SFN) の差し替え可能 signature を再現。

```ts
export declare function createWorkflowClient(options?: CreateWorkflowClientOptions): WorkflowClient;
```

### 型

#### <code v-pre>CreateWorkflowClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L38) <code v-pre>packages/workflow/src/client.ts</code>

```ts
export interface CreateWorkflowClientOptions {
    provider?: WorkflowProvider;
    now?: () => number;
    idSeed?: number;
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

#### <code v-pre>WorkflowProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/client.ts#L10) <code v-pre>packages/workflow/src/client.ts</code>

```ts
export type WorkflowProvider = 'temporal' | 'inngest' | 'trigger' | 'aws-sfn';
```
