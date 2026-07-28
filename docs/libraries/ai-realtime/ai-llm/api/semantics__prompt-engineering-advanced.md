---
title: "@kiwa-lab/ai-llm semantics__prompt-engineering-advanced の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics&#95;&#95;prompt-engineering-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>cachePrompt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L109) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export declare function cachePrompt(session: PeaSession, input: {
    key: string;
    value: string;
}): {
    step: AxisStep<PeaState>;
    entry: PeaCacheEntry;
    wasHit: boolean;
};
```

#### <code v-pre>expandChainOfThought</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L67) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export declare function expandChainOfThought(session: PeaSession, input: {
    thoughts: string[];
}): {
    step: AxisStep<PeaState>;
    steps: CotStep[];
};
```

#### <code v-pre>pinVersion</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L136) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export declare function pinVersion(session: PeaSession, input: {
    semver: string;
    hash: string;
}): {
    step: AxisStep<PeaState>;
    version: string;
};
```

#### <code v-pre>selectFewShot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L89) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export declare function selectFewShot(session: PeaSession, input: {
    pool: FewShotExample[];
    k: number;
}): {
    step: AxisStep<PeaState>;
    selected: FewShotExample[];
};
```

#### <code v-pre>startPeaSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L48) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export declare function startPeaSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): PeaSession;
```

### 型

#### <code v-pre>CotStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L19) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export interface CotStep {
    index: number;
    thought: string;
}
```

#### <code v-pre>FewShotExample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L24) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export interface FewShotExample {
    id: string;
    input: string;
    output: string;
    score: number;
}
```

#### <code v-pre>PeaCacheEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L31) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export interface PeaCacheEntry {
    key: string;
    value: string;
    hits: number;
}
```

#### <code v-pre>PeaSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L37) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

```ts
export interface PeaSession {
    target: AiLlmTarget;
    sessionId: string;
    state: PeaState;
    history: AxisStep<PeaState>[];
    cot: CotStep[];
    fewShot: FewShotExample[];
    cache: Map<string, PeaCacheEntry>;
    currentVersion: string | null;
}
```

#### <code v-pre>PeaState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-engineering-advanced.ts#L12) <code v-pre>packages/ai-llm/src/semantics/prompt-engineering-advanced.ts</code>

Prompt engineering advanced axis — chain-of-thought + few-shot + caching + versioning state machine。 Deterministic mock で 4 signal 系統。 CoT expands stepwise reasoning、 few-shot picks k best by score、 caching uses deterministic key hash、 versioning pins semver + hash pair。

```ts
export type PeaState = 'idle' | 'chain-of-thought-expanded' | 'few-shot-selected' | 'cached' | 'version-pinned';
```
