---
title: "@kiwa-lab/ai-llm semantics__fine-tuning-eval の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics&#95;&#95;fine-tuning-eval</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>detectBenchmarkDrift</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L149) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export declare function detectBenchmarkDrift(session: FtSession, input: {
    current: BenchmarkResult[];
    driftThreshold?: number;
}): {
    step: AxisStep<FtState>;
    drifted: Array<{
        name: string;
        delta: number;
    }>;
};
```

#### <code v-pre>detectCatastrophicForgetting</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L113) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export declare function detectCatastrophicForgetting(session: FtSession, input: {
    baseline: BenchmarkResult[];
    postFineTune: BenchmarkResult[];
    threshold?: number;
}): {
    step: AxisStep<FtState>;
    forgotten: Array<{
        name: string;
        drop: number;
    }>;
    averageDrop: number;
};
```

#### <code v-pre>evaluateDpo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L87) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export declare function evaluateDpo(session: FtSession, samples: DpoSample[]): {
    step: AxisStep<FtState>;
    averageMargin: number;
    preferenceAccuracy: number;
};
```

#### <code v-pre>evaluateSft</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L58) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export declare function evaluateSft(session: FtSession, samples: SftSample[]): {
    step: AxisStep<FtState>;
    averageF1: number;
    exactMatchRate: number;
};
```

#### <code v-pre>startFtSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L42) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export declare function startFtSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): FtSession;
```

### 型

#### <code v-pre>BenchmarkResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L37) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export interface BenchmarkResult {
    name: string;
    score: number;
}
```

#### <code v-pre>DpoSample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L29) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export interface DpoSample {
    prompt: string;
    chosen: string;
    rejected: string;
    chosenLogp: number;
    rejectedLogp: number;
}
```

#### <code v-pre>FtSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L15) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export interface FtSession {
    target: AiLlmTarget;
    sessionId: string;
    state: FtState;
    history: AxisStep<FtState>[];
    baselineBenchmarks: Map<string, number>;
}
```

#### <code v-pre>FtState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L8) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

Fine-tuning eval axis — SFT/DPO + catastrophic forgetting + benchmark drift state machine。 deterministic mock で 4 signal 系統。

```ts
export type FtState = 'idle' | 'sft-evaluated' | 'dpo-evaluated' | 'forgetting-detected' | 'drift-detected';
```

#### <code v-pre>SftSample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-eval.ts#L23) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-eval.ts</code>

```ts
export interface SftSample {
    prompt: string;
    gold: string;
    candidate: string;
}
```
