---
title: "@kiwa-lab/ai-llm semantics__llm-eval の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics&#95;&#95;llm-eval</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>applyRubric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L81) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export declare function applyRubric(session: EvalSession, input: {
    candidateId: string;
    criteria: RubricCriterion[];
}): {
    step: AxisStep<EvalState>;
    weightedScore: number;
};
```

#### <code v-pre>judgeCandidates</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L51) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export declare function judgeCandidates(session: EvalSession, input: {
    prompt: string;
    candidates: Array<{
        id: string;
        text: string;
        groundTruth?: string;
    }>;
}): {
    step: AxisStep<EvalState>;
    verdicts: JudgeVerdict[];
};
```

#### <code v-pre>rankPreference</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L104) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export declare function rankPreference(session: EvalSession, input: {
    pairs: Array<{
        a: string;
        b: string;
        preferred: 'a' | 'b' | 'tie';
    }>;
}): {
    step: AxisStep<EvalState>;
    ranking: Array<{
        id: string;
        wins: number;
        losses: number;
        ties: number;
    }>;
};
```

#### <code v-pre>startEvalSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L35) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export declare function startEvalSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): EvalSession;
```

#### <code v-pre>updateElo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L148) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export declare function updateElo(session: EvalSession, input: {
    winner: string;
    loser: string;
    k?: number;
}): {
    step: AxisStep<EvalState>;
    winnerRating: number;
    loserRating: number;
};
```

### 型

#### <code v-pre>EvalSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L15) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export interface EvalSession {
    target: AiLlmTarget;
    sessionId: string;
    state: EvalState;
    history: AxisStep<EvalState>[];
    eloRatings: Map<string, number>;
}
```

#### <code v-pre>EvalState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L8) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

LLM eval axis — LLM-as-judge + rubric + preference + Elo + human-in-the-loop state machine。 deterministic mock で 4 signal 系統を提供。

```ts
export type EvalState = 'idle' | 'judged' | 'rubric-applied' | 'preference-ranked' | 'elo-updated';
```

#### <code v-pre>JudgeVerdict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L23) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export interface JudgeVerdict {
    candidateId: string;
    score: number;
    reasoning: string;
}
```

#### <code v-pre>RubricCriterion</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/llm-eval.ts#L29) <code v-pre>packages/ai-llm/src/semantics/llm-eval.ts</code>

```ts
export interface RubricCriterion {
    key: string;
    weight: number;
    score: number;
}
```
