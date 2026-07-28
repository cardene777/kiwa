---
title: "@kiwa-lab/ai-llm semantics__hallucination の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics&#95;&#95;hallucination</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>checkFactuality</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L76) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

```ts
export declare function checkFactuality(session: HallucinationSession, input: {
    claim: string;
    evidence: string[];
}): {
    step: AxisStep<HallucinationState>;
    score: number;
    matches: string[];
};
```

#### <code v-pre>scoreConfidence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L136) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

```ts
export declare function scoreConfidence(session: HallucinationSession, text: string): {
    step: AxisStep<HallucinationState>;
    score: number;
    hedgingRatio: number;
};
```

#### <code v-pre>scoreSelfConsistency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L48) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

```ts
export declare function scoreSelfConsistency(session: HallucinationSession, samples: string[]): {
    step: AxisStep<HallucinationState>;
    score: number;
};
```

#### <code v-pre>startHallucinationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L32) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

```ts
export declare function startHallucinationSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): HallucinationSession;
```

#### <code v-pre>verifyCitation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L108) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

```ts
export declare function verifyCitation(session: HallucinationSession, input: {
    citations: string[];
    corpus: string[];
}): {
    step: AxisStep<HallucinationState>;
    score: number;
    missing: string[];
};
```

### 型

#### <code v-pre>HallucinationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L19) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

```ts
export interface HallucinationSession {
    target: AiLlmTarget;
    sessionId: string;
    state: HallucinationState;
    history: AxisStep<HallucinationState>[];
    scores: {
        selfConsistency?: number;
        factuality?: number;
        citation?: number;
        confidence?: number;
    };
}
```

#### <code v-pre>HallucinationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/hallucination.ts#L12) <code v-pre>packages/ai-llm/src/semantics/hallucination.ts</code>

Hallucination detection axis — self-consistency + factuality + citation + confidence + hedging state machine。 Deterministic mock で 5 signal 系統。 self-consistency は複数 sample 間の token-overlap 比率、 factuality は claim vs evidence の string match、 citation は引用先の存在 check、 confidence / hedging は modal 語彙密度。

```ts
export type HallucinationState = 'idle' | 'self-consistency-scored' | 'factuality-checked' | 'citation-verified' | 'confidence-scored';
```
