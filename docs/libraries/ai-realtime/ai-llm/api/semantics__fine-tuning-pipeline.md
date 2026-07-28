---
title: "@kiwa-lab/ai-llm semantics__fine-tuning-pipeline の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics&#95;&#95;fine-tuning-pipeline</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>detectDrift</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L150) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export declare function detectDrift(session: FtpSession, input: {
    threshold: number;
}): {
    step: AxisStep<FtpState>;
    drifted: boolean;
    delta: number;
};
```

#### <code v-pre>prepareDataset</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L67) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export declare function prepareDataset(session: FtpSession, input: {
    samples: FtpSample[];
    dedupe: boolean;
}): {
    step: AxisStep<FtpState>;
    sampleCount: number;
    deduped: number;
};
```

#### <code v-pre>runEvalLoop</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L122) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export declare function runEvalLoop(session: FtpSession, input: {
    epochScores: number[];
}): {
    step: AxisStep<FtpState>;
    bestScore: number;
    averageScore: number;
};
```

#### <code v-pre>startFtpSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L48) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export declare function startFtpSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): FtpSession;
```

#### <code v-pre>stepRlhf</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L98) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export declare function stepRlhf(session: FtpSession, input: {
    rewards: number[];
    learningRate: number;
}): {
    step: AxisStep<FtpState>;
    totalStep: FtpRlhfStep;
};
```

### 型

#### <code v-pre>FtpEvalRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L32) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export interface FtpEvalRecord {
    epoch: number;
    score: number;
}
```

#### <code v-pre>FtpRlhfStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L26) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export interface FtpRlhfStep {
    step: number;
    reward: number;
    policyDelta: number;
}
```

#### <code v-pre>FtpSample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L20) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export interface FtpSample {
    prompt: string;
    chosen: string;
    rejected: string;
}
```

#### <code v-pre>FtpSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L37) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

```ts
export interface FtpSession {
    target: AiLlmTarget;
    sessionId: string;
    state: FtpState;
    history: AxisStep<FtpState>[];
    dataset: FtpSample[];
    rlhfSteps: FtpRlhfStep[];
    evalHistory: FtpEvalRecord[];
    baselineScore: number | null;
}
```

#### <code v-pre>FtpState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fine-tuning-pipeline.ts#L13) <code v-pre>packages/ai-llm/src/semantics/fine-tuning-pipeline.ts</code>

Fine-tuning pipeline axis — dataset prep + RLHF/DPO + eval loop + drift detection state machine。 Deterministic mock で 4 signal 系統。 dataset prep is dedup + shuffle by hash、 RLHF stepping is reward gradient sign + policy update、 eval loop accumulates score history、 drift detection compares latest eval vs baseline via absolute threshold。

```ts
export type FtpState = 'idle' | 'dataset-prepared' | 'rlhf-stepped' | 'eval-loop-ran' | 'drift-detected';
```
