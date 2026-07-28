---
title: "@kiwa-lab/workflow steps の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/workflow</code> <code v-pre>steps</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>defineWorkflow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L22) <code v-pre>packages/workflow/src/steps.ts</code>

```ts
export declare function defineWorkflow(name: string, steps: WorkflowStep[]): WorkflowDefinition;
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

### 型

#### <code v-pre>WorkflowDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L17) <code v-pre>packages/workflow/src/steps.ts</code>

```ts
export interface WorkflowDefinition {
    name: string;
    steps: WorkflowStep[];
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
