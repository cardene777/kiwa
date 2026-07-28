---
title: "@kiwa-lab/ai-llm semantics-llm-ops の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics-llm-ops</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>advanceRollout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L86) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function advanceRollout(session: OpsSession, input: {
    targetPercent: number;
    incrementPercent: number;
}): {
    step: AxisStep<OpsState>;
    currentPercent: number;
    reachedTarget: boolean;
};
```

#### <code v-pre>compareShadow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L168) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function compareShadow(session: OpsSession, input: {
    productionScores: number[];
    shadowScores: number[];
}): {
    step: AxisStep<OpsState>;
    delta: number;
    better: boolean;
};
```

#### <code v-pre>evaluateAb</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L110) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function evaluateAb(session: OpsSession, input: {
    results: OpsAbResult[];
    minSamples: number;
}): {
    step: AxisStep<OpsState>;
    winner: string | null;
    delta: number;
};
```

#### <code v-pre>promoteCanary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L142) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function promoteCanary(session: OpsSession, input: {
    canaryVersion: string;
    errorRate: number;
    threshold: number;
}): {
    step: AxisStep<OpsState>;
    promoted: boolean;
};
```

#### <code v-pre>startOpsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L43) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function startOpsSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): OpsSession;
```

#### <code v-pre>updateRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L61) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export declare function updateRegistry(session: OpsSession, input: {
    version: string;
    activate: boolean;
}): {
    step: AxisStep<OpsState>;
    registrySize: number;
};
```

### 型

#### <code v-pre>OpsAbResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L27) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export interface OpsAbResult {
    variant: string;
    score: number;
    samples: number;
}
```

#### <code v-pre>OpsModelEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L21) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export interface OpsModelEntry {
    version: string;
    createdAtMs: number;
    active: boolean;
}
```

#### <code v-pre>OpsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L33) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

```ts
export interface OpsSession {
    target: AiLlmTarget;
    sessionId: string;
    state: OpsState;
    history: AxisStep<OpsState>[];
    registry: OpsModelEntry[];
    rolloutPercent: number;
    abWinner: string | null;
}
```

#### <code v-pre>OpsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-ops.ts#L13) <code v-pre>packages/ai-llm/src/semantics/llm-ops.ts</code>

LLM ops axis — model registry + rollout + A/B + canary + shadow state machine。 Deterministic mock で 5 signal 系統。 registry updates append versioned entries、 rollout tracks percentage advancement、 A/B computes winner by mean score、 canary promotion is threshold check、 shadow comparison computes delta。

```ts
export type OpsState = 'idle' | 'registry-updated' | 'rollout-advanced' | 'ab-evaluated' | 'canary-promoted' | 'shadow-compared';
```
