---
title: "@kiwa-lab/ai-llm semantics__cost-latency-sla の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics&#95;&#95;cost-latency-sla</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>checkBudget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L58) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export declare function checkBudget(session: SlaSession, input: {
    cost: number;
}): {
    step: AxisStep<SlaState>;
    allowed: boolean;
    remaining: number;
};
```

#### <code v-pre>engageFallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L140) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export declare function engageFallback(session: SlaSession, input: {
    ladder: string[];
    failed: string[];
}): {
    step: AxisStep<SlaState>;
    nextModel: string | null;
    attemptedCount: number;
};
```

#### <code v-pre>measureLatency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L80) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export declare function measureLatency(session: SlaSession, samples: LatencySample[]): {
    step: AxisStep<SlaState>;
    p50: number;
    p95: number;
    p99: number;
    count: number;
};
```

#### <code v-pre>routeModel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L112) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export declare function routeModel(session: SlaSession, input: {
    candidates: RoutingCandidate[];
    slaLatencyMs: number;
    minQuality: number;
}): {
    step: AxisStep<SlaState>;
    chosen: RoutingCandidate | null;
    considered: RoutingCandidate[];
};
```

#### <code v-pre>startSlaSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L39) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export declare function startSlaSession(input: {
    target: AiLlmTarget;
    sessionId: string;
    budgetUsd: number;
}): SlaSession;
```

### 型

#### <code v-pre>LatencySample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L27) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export interface LatencySample {
    requestId: string;
    latencyMs: number;
}
```

#### <code v-pre>RoutingCandidate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L32) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export interface RoutingCandidate {
    model: string;
    costPerCall: number;
    latencyMs: number;
    qualityScore: number;
}
```

#### <code v-pre>SlaSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L18) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

```ts
export interface SlaSession {
    target: AiLlmTarget;
    sessionId: string;
    state: SlaState;
    history: AxisStep<SlaState>[];
    spent: number;
    budgetUsd: number;
}
```

#### <code v-pre>SlaState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/cost-latency-sla.ts#L11) <code v-pre>packages/ai-llm/src/semantics/cost-latency-sla.ts</code>

Cost / latency SLA axis — budget + p50/p99 + model routing + fallback ladder state machine。 deterministic mock で 4 signal 系統。 Budget guard は real driver 経路 (KIWA_MODE=real) で $ 上限を強制する SSOT。 mock 経路でも 4 SDK 全部に同じ SLA API を提供する。

```ts
export type SlaState = 'idle' | 'budget-checked' | 'latency-measured' | 'model-routed' | 'fallback-engaged';
```
