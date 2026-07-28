---
title: "@kiwa-lab/realtime semantics__realtime-ai-inference の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;realtime-ai-inference</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/realtime-ai-inference.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createRealtimeAiInferenceMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/realtime-ai-inference.ts#L37) <code v-pre>packages/realtime/src/semantics/realtime-ai-inference.ts</code>

```ts
export declare function createRealtimeAiInferenceMock(config?: SemanticsMockConfig): RealtimeAiInferenceMock;
```

### 型

#### <code v-pre>AiInferenceRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/realtime-ai-inference.ts#L15) <code v-pre>packages/realtime/src/semantics/realtime-ai-inference.ts</code>

Realtime AI inference axis — per-frame prediction + latency budget enforcement + drop on budget exceed。 real-time AR / VR / robot control 用の budget-aware inference pipeline pattern (target &lt; 33ms for 30fps)。

```ts
export interface AiInferenceRequest {
    requestId: string;
    frameNumber: number;
    modelName: string;
    budgetMs: number;
}
```

#### <code v-pre>AiInferenceResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/realtime-ai-inference.ts#L22) <code v-pre>packages/realtime/src/semantics/realtime-ai-inference.ts</code>

```ts
export interface AiInferenceResponse {
    requestId: string;
    latencyMs: number;
    outputBytes: number;
}
```

#### <code v-pre>RealtimeAiInferenceMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/realtime-ai-inference.ts#L28) <code v-pre>packages/realtime/src/semantics/realtime-ai-inference.ts</code>

```ts
export interface RealtimeAiInferenceMock extends SemanticsMock {
    readonly protocol: 'ai-media';
    readonly axis: 'realtime-ai-inference';
    sendRequest(input: AiInferenceRequest): Promise<void>;
    receiveResponse(input: AiInferenceResponse): Promise<void>;
    reportBudget(input: {
        requestId: string;
        budgetMs: number;
        consumedMs: number;
    }): Promise<void>;
    dropRequest(input: {
        requestId: string;
        reason: string;
    }): Promise<void>;
}
```
