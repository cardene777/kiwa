---
title: "@kiwa-lab/ai-llm semantics-rag-iii の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics-rag-iii</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>expandParent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L171) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export declare function expandParent(session: Rag3Session, input: {
    chunkId: string;
    parents: RagParentDoc[];
}): {
    step: AxisStep<Rag3State>;
    parent: RagParentDoc | null;
};
```

#### <code v-pre>selfQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L144) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export declare function selfQuery(session: Rag3Session, input: {
    question: string;
    schemaFields: string[];
}): {
    step: AxisStep<Rag3State>;
    predicate: string;
    matchedFields: string[];
};
```

#### <code v-pre>startRag3Session</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L54) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export declare function startRag3Session(input: {
    target: AiLlmTarget;
    sessionId: string;
}): Rag3Session;
```

#### <code v-pre>stepAgentic</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L119) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export declare function stepAgentic(session: Rag3Session, input: {
    confidence: number;
    threshold: number;
    reason: string;
}): {
    step: AxisStep<Rag3State>;
    action: 'fetch' | 'answer';
    index: number;
};
```

#### <code v-pre>traverseGraph</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L73) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export declare function traverseGraph(session: Rag3Session, input: {
    nodes: RagGraphNode[];
    edges: RagGraphEdge[];
    startNodeId: string;
    maxHops: number;
}): {
    step: AxisStep<Rag3State>;
    visited: string[];
    totalWeight: number;
};
```

### 型

#### <code v-pre>Rag3Session</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L43) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export interface Rag3Session {
    target: AiLlmTarget;
    sessionId: string;
    state: Rag3State;
    history: AxisStep<Rag3State>[];
    graphNodes: RagGraphNode[];
    graphEdges: RagGraphEdge[];
    agenticTrace: RagAgenticStep[];
    parents: RagParentDoc[];
}
```

#### <code v-pre>Rag3State</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L13) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

RAG III axis — GraphRAG + agentic + self-querying + parent document state machine。 Deterministic mock で 4 signal 系統。 graph traversal follows entity edges with BFS、 agentic RAG step decides fetch vs answer via score gate、 self-querying converts NL to filter predicate deterministically、 parent document expansion returns full doc from chunk id lookup。

```ts
export type Rag3State = 'idle' | 'graph-traversed' | 'agentic-stepped' | 'self-queried' | 'parent-expanded';
```

#### <code v-pre>RagAgenticStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L31) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export interface RagAgenticStep {
    index: number;
    action: 'fetch' | 'answer';
    reason: string;
}
```

#### <code v-pre>RagGraphEdge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L25) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export interface RagGraphEdge {
    from: string;
    to: string;
    weight: number;
}
```

#### <code v-pre>RagGraphNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L20) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export interface RagGraphNode {
    id: string;
    label: string;
}
```

#### <code v-pre>RagParentDoc</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/rag-iii.ts#L37) <code v-pre>packages/ai-llm/src/semantics/rag-iii.ts</code>

```ts
export interface RagParentDoc {
    id: string;
    content: string;
    chunkIds: string[];
}
```
