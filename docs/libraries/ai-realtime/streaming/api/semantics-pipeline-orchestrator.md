---
title: "@kiwa-lab/streaming semantics-pipeline-orchestrator の API 契約"
---

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>semantics-pipeline-orchestrator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>startPipeline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L41) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

```ts
export declare function startPipeline(input: {
    timestamp: string;
}): PipelineSession;
```

#### <code v-pre>summarizePipeline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L158) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

```ts
export declare function summarizePipeline(session: PipelineSession): PipelineSummary;
```

### 型

#### <code v-pre>PipelineEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L21) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

```ts
export type PipelineEvent = 'produce-succeeded' | 'produce-failed' | 'consume-succeeded' | 'consume-failed' | 'rebalance-triggered' | 'rebalance-completed' | 'dlq-message-added' | 'stop-requested';
```

#### <code v-pre>PipelineSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L31) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

```ts
export interface PipelineSession {
    state: PipelineState;
    messagesProduced: number;
    messagesConsumed: number;
    rebalancesExecuted: number;
    dlqMessagesCount: number;
    lastEventAt: string;
    events: string[];
}
```

#### <code v-pre>PipelineState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L14) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

v2.1 pipeline-orchestrator = producer + consumer group + exactly-once + DLQ + schema registry の 継続合成 layer。 Streaming pair v0.1 → v2.1 = 5 段深化到達 = **depth-5 pattern 6 例目発生** (Mobile + Desktop + quality-metrics + Payment + Realtime + Streaming = 6 pair 到達 = **systematic law confirmed**)、 pattern 昇格階段 の 最上位 = kiwa 全体 の 必ず守る 最上位規範化 confirmed。 shape 契約 preserving 絶対維持 = 既存 API (v0.1-v0.3) 変更 0、 新規 file 追加 のみ、 backward compat 絶対維持。

```ts
export type PipelineState = 'producing' | 'consuming' | 'rebalancing' | 'dlq-active' | 'stopped';
```

#### <code v-pre>PipelineSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L146) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

```ts
export interface PipelineSummary {
    currentState: PipelineState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    messagesProduced: number;
    messagesConsumed: number;
    rebalancesExecuted: number;
    dlqMessagesCount: number;
}
```
