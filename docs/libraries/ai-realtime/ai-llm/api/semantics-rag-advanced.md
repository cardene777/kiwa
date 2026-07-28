---
title: "@kiwa-lab/ai-llm semantics-rag-advanced の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics-rag-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>chunkDocument</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L50) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export declare function chunkDocument(session: RagSession, input: {
    doc: string;
    chunkSize: number;
    overlap: number;
}): {
    step: AxisStep<RagState>;
    chunks: Array<{
        id: string;
        text: string;
    }>;
};
```

#### <code v-pre>compressContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L137) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export declare function compressContext(session: RagSession, input: {
    hits: RerankedHit[];
    maxTokens: number;
}): {
    step: AxisStep<RagState>;
    compressed: string;
    keptCount: number;
    totalTokens: number;
};
```

#### <code v-pre>hybridRetrieve</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L80) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export declare function hybridRetrieve(session: RagSession, input: {
    query: string;
    denseWeight: number;
    sparseWeight: number;
    topK: number;
}): {
    step: AxisStep<RagState>;
    hits: RetrievalHit[];
};
```

#### <code v-pre>rerank</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L113) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export declare function rerank(session: RagSession, input: {
    query: string;
    hits: RetrievalHit[];
}): {
    step: AxisStep<RagState>;
    reranked: RerankedHit[];
};
```

#### <code v-pre>startRagSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L34) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export declare function startRagSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): RagSession;
```

### 型

#### <code v-pre>RagSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L15) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export interface RagSession {
    target: AiLlmTarget;
    sessionId: string;
    state: RagState;
    history: AxisStep<RagState>[];
    chunks: Array<{
        id: string;
        text: string;
    }>;
}
```

#### <code v-pre>RagState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L8) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

RAG advanced axis — chunking + hybrid retrieval + reranking + citation + context compression state machine。 deterministic mock で 5 signal 系統。

```ts
export type RagState = 'idle' | 'chunked' | 'hybrid-retrieved' | 'reranked' | 'compressed';
```

#### <code v-pre>RerankedHit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L30) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export interface RerankedHit extends RetrievalHit {
    rerankScore: number;
}
```

#### <code v-pre>RetrievalHit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-advanced.ts#L23) <code v-pre>packages/ai-llm/src/semantics/rag-advanced.ts</code>

```ts
export interface RetrievalHit {
    id: string;
    text: string;
    score: number;
    source: 'dense' | 'sparse';
}
```
