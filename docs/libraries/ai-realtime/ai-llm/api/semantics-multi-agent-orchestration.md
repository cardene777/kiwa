---
title: "@kiwa-lab/ai-llm semantics-multi-agent-orchestration の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics-multi-agent-orchestration</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>assembleCrew</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L76) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export declare function assembleCrew(session: MaoSession, input: {
    agents: MaoAgent[];
}): {
    step: AxisStep<MaoState>;
    agentCount: number;
};
```

#### <code v-pre>completeRound</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L160) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export declare function completeRound(session: MaoSession, input: {
    minDelegations: number;
}): {
    step: AxisStep<MaoState>;
    roundsCompleted: number;
    sufficient: boolean;
};
```

#### <code v-pre>delegateBySupervisor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L96) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export declare function delegateBySupervisor(session: MaoSession, input: {
    supervisorId: string;
    task: string;
    workerIds: string[];
}): {
    step: AxisStep<MaoState>;
    delegation: MaoDelegation;
};
```

#### <code v-pre>startMaoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L55) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export declare function startMaoSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): MaoSession;
```

#### <code v-pre>transitionGraph</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L128) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export declare function transitionGraph(session: MaoSession, input: {
    nodes: MaoGraphNode[];
    edges: MaoGraphEdge[];
    entryNodeId: string;
}): {
    step: AxisStep<MaoState>;
    visited: string[];
};
```

### 型

#### <code v-pre>MaoAgent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L19) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export interface MaoAgent {
    id: string;
    role: string;
    capabilities: string[];
}
```

#### <code v-pre>MaoDelegation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L25) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export interface MaoDelegation {
    round: number;
    supervisor: string;
    worker: string;
    task: string;
}
```

#### <code v-pre>MaoGraphEdge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L37) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export interface MaoGraphEdge {
    from: string;
    to: string;
}
```

#### <code v-pre>MaoGraphNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L32) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export interface MaoGraphNode {
    id: string;
    agentId: string;
}
```

#### <code v-pre>MaoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L42) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

```ts
export interface MaoSession {
    target: AiLlmTarget;
    sessionId: string;
    state: MaoState;
    history: AxisStep<MaoState>[];
    crew: MaoAgent[];
    delegations: MaoDelegation[];
    graphNodes: MaoGraphNode[];
    graphEdges: MaoGraphEdge[];
    currentNode: string | null;
    rounds: number;
}
```

#### <code v-pre>MaoState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/multi-agent-orchestration.ts#L12) <code v-pre>packages/ai-llm/src/semantics/multi-agent-orchestration.ts</code>

Multi-agent orchestration axis — CrewAI + AutoGen + LangGraph + supervisor pattern state machine。 Deterministic mock で 4 signal 系統。 crew assembly is role list snapshot、 supervisor delegation is deterministic round-robin、 graph transition is edge follow、 round completion is delegation count check。

```ts
export type MaoState = 'idle' | 'crew-assembled' | 'supervisor-delegated' | 'graph-transitioned' | 'round-completed';
```
