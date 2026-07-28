---
title: "@kiwa-lab/queue semantics__job-lifecycle-orchestrator の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>semantics&#95;&#95;job-lifecycle-orchestrator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>startJob</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L36) <code v-pre>packages/queue/src/semantics/job-lifecycle-orchestrator.ts</code>

```ts
export declare function startJob(input: {
    timestamp: string;
}): JobSession;
```

#### <code v-pre>summarizeJob</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L138) <code v-pre>packages/queue/src/semantics/job-lifecycle-orchestrator.ts</code>

```ts
export declare function summarizeJob(session: JobSession): JobSummary;
```

### 型

#### <code v-pre>JobEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L14) <code v-pre>packages/queue/src/semantics/job-lifecycle-orchestrator.ts</code>

```ts
export type JobEvent = 'enqueue-succeeded' | 'process-started' | 'process-succeeded' | 'process-failed' | 'retry-scheduled' | 'retry-exhausted' | 'dlq-inspected' | 'timeout';
```

#### <code v-pre>JobSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L24) <code v-pre>packages/queue/src/semantics/job-lifecycle-orchestrator.ts</code>

```ts
export interface JobSession {
    state: JobState;
    enqueues: number;
    processStarts: number;
    processSuccesses: number;
    processFailures: number;
    retries: number;
    dlqInspections: number;
    lastEventAt: string;
    events: string[];
}
```

#### <code v-pre>JobSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L124) <code v-pre>packages/queue/src/semantics/job-lifecycle-orchestrator.ts</code>

```ts
export interface JobSummary {
    currentState: JobState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    enqueues: number;
    processStarts: number;
    processSuccesses: number;
    processFailures: number;
    retries: number;
    dlqInspections: number;
}
```
