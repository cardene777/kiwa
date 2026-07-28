---
title: "@kiwa-lab/ai-llm semantics__agent-orchestration の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics&#95;&#95;agent-orchestration</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>expandToT</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L86) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export declare function expandToT(session: AgentSession, input: {
    root: {
        thought: string;
    };
    branches: Array<{
        thought: string;
        score: number;
    }>;
    depth: number;
}): {
    step: AxisStep<AgentState>;
    nodeCount: number;
};
```

#### <code v-pre>reactStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L67) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export declare function reactStep(session: AgentSession, input: {
    thought: string;
    action: {
        tool: string;
        input: string;
    };
    observation: string;
}): {
    step: AxisStep<AgentState>;
    trace: ReactStep[];
};
```

#### <code v-pre>reflectAndCorrect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L118) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export declare function reflectAndCorrect(session: AgentSession, input: {
    output: string;
    critiqueRules: string[];
}): {
    step: AxisStep<AgentState>;
    reflection: Reflection;
};
```

#### <code v-pre>selectTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L148) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export declare function selectTool(session: AgentSession, input: {
    intent: string;
    candidates: Array<{
        name: string;
        description: string;
    }>;
}): {
    step: AxisStep<AgentState>;
    selected: ToolCandidate | null;
    ranking: ToolCandidate[];
};
```

#### <code v-pre>startAgentSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L50) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export declare function startAgentSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): AgentSession;
```

### 型

#### <code v-pre>AgentSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L15) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export interface AgentSession {
    target: AiLlmTarget;
    sessionId: string;
    state: AgentState;
    history: AxisStep<AgentState>[];
    reactTrace: ReactStep[];
    totTree: ToTNode | null;
}
```

#### <code v-pre>AgentState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L8) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

Agent orchestration axis — ReAct + Tree-of-Thought + reflection + self-correction + planning + tool selection state machine。

```ts
export type AgentState = 'idle' | 'react-stepped' | 'tot-expanded' | 'reflected' | 'tool-selected';
```

#### <code v-pre>ReactStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L24) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export interface ReactStep {
    index: number;
    thought: string;
    action: {
        tool: string;
        input: string;
    };
    observation: string;
}
```

#### <code v-pre>Reflection</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L38) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export interface Reflection {
    cycle: number;
    critique: string;
    revised: string;
}
```

#### <code v-pre>ToolCandidate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L44) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export interface ToolCandidate {
    name: string;
    description: string;
    score: number;
}
```

#### <code v-pre>ToTNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/agent-orchestration.ts#L31) <code v-pre>packages/ai-llm/src/semantics/agent-orchestration.ts</code>

```ts
export interface ToTNode {
    id: string;
    thought: string;
    score: number;
    children: ToTNode[];
}
```
