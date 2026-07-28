---
title: "@kiwa-lab/ai-llm semantics__agent-swarm の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics&#95;&#95;agent-swarm</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>allocateTasks</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L94) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export declare function allocateTasks(session: SwarmSession, input: {
    tasks: Array<{
        id: string;
        priority: number;
    }>;
}): {
    step: AxisStep<SwarmState>;
    allocations: SwarmTask[];
};
```

#### <code v-pre>assignRoles</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L69) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export declare function assignRoles(session: SwarmSession, input: {
    agents: Array<{
        id: string;
        reliability: number;
    }>;
    roles: string[];
}): {
    step: AxisStep<SwarmState>;
    assignments: SwarmAgent[];
};
```

#### <code v-pre>reachConsensus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L119) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export declare function reachConsensus(session: SwarmSession, input: {
    votes: SwarmVote[];
}): {
    step: AxisStep<SwarmState>;
    winner: string | null;
    agreementRatio: number;
};
```

#### <code v-pre>startSwarmSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L47) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export declare function startSwarmSession(input: {
    target: AiLlmTarget;
    sessionId: string;
    faultThreshold?: number;
}): SwarmSession;
```

#### <code v-pre>tolerateByzantine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L150) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export declare function tolerateByzantine(session: SwarmSession, input: {
    faultyAgentIds: string[];
}): {
    step: AxisStep<SwarmState>;
    tolerated: boolean;
    honestRatio: number;
};
```

### 型

#### <code v-pre>SwarmAgent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L19) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export interface SwarmAgent {
    id: string;
    role: string;
    reliability: number;
}
```

#### <code v-pre>SwarmSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L36) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export interface SwarmSession {
    target: AiLlmTarget;
    sessionId: string;
    state: SwarmState;
    history: AxisStep<SwarmState>[];
    agents: SwarmAgent[];
    tasks: SwarmTask[];
    votes: SwarmVote[];
    faultThreshold: number;
}
```

#### <code v-pre>SwarmState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L12) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

Agent swarm axis — role-based + task allocation + consensus + Byzantine fault tolerance state machine。 Deterministic mock で 4 signal 系統。 roles assign by index modulo、 tasks allocated by round robin、 consensus via majority vote、 Byzantine fault tolerance via &gt; 2/3 honest agreement (PBFT-lite invariant)。

```ts
export type SwarmState = 'idle' | 'roles-assigned' | 'tasks-allocated' | 'consensus-reached' | 'byzantine-tolerated';
```

#### <code v-pre>SwarmTask</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L25) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export interface SwarmTask {
    id: string;
    assignee: string;
    priority: number;
}
```

#### <code v-pre>SwarmVote</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-swarm.ts#L31) <code v-pre>packages/ai-llm/src/semantics/agent-swarm.ts</code>

```ts
export interface SwarmVote {
    agentId: string;
    proposal: string;
}
```
