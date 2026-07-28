---
title: "@kiwa-lab/ai-llm semantics-cost-optimization の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics-cost-optimization</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>compressPrompt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L67) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export declare function compressPrompt(session: CoSession, input: {
    prompt: string;
    maxChars?: number;
}): {
    step: AxisStep<CoState>;
    compressed: string;
    ratio: number;
};
```

#### <code v-pre>lookupSemanticCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L123) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export declare function lookupSemanticCache(session: CoSession, input: {
    queryHash: string;
    value?: string;
}): {
    step: AxisStep<CoState>;
    hit: boolean;
    cached: string | null;
};
```

#### <code v-pre>startCoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L27) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export declare function startCoSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): CoSession;
```

#### <code v-pre>stepCascade</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L89) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export declare function stepCascade(session: CoSession, input: {
    confidence: number;
    tiers: Array<{
        name: string;
        costPerToken: number;
        confidenceThreshold: number;
    }>;
}): {
    step: AxisStep<CoState>;
    selectedTier: string;
    escalated: boolean;
};
```

#### <code v-pre>submitBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L43) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export declare function submitBatch(session: CoSession, input: {
    requests: Array<{
        id: string;
        tokens: number;
    }>;
    batchSizeLimit?: number;
}): {
    step: AxisStep<CoState>;
    batchCount: number;
    estimatedSavings: number;
};
```

### 型

#### <code v-pre>CoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L19) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

```ts
export interface CoSession {
    target: AiLlmTarget;
    sessionId: string;
    state: CoState;
    history: AxisStep<CoState>[];
    cache: Map<string, string>;
}
```

#### <code v-pre>CoState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-optimization.ts#L12) <code v-pre>packages/ai-llm/src/semantics/cost-optimization.ts</code>

Cost optimization axis — batch API + prompt compression + model cascade + semantic cache state machine。 Deterministic mock で 4 signal 系統。 batch submit is size + estimate、 prompt compression is char delta、 model cascade is threshold + tier、 semantic cache is hash lookup。

```ts
export type CoState = 'idle' | 'batch-submitted' | 'prompt-compressed' | 'cascade-stepped' | 'semantic-cached';
```
