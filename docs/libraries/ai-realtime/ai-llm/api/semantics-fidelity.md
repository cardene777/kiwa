---
title: "@kiwa-lab/ai-llm semantics-fidelity の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics-fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>AI&#95;LLM&#95;AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L21) <code v-pre>packages/ai-llm/src/semantics/fidelity.ts</code>

```ts
export declare const AI_LLM_AXIS_TO_EVENTS: Record<AiLlmAxis, NeutralEventName[]>;
```

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L118) <code v-pre>packages/ai-llm/src/semantics/fidelity.ts</code>

```ts
export declare function collectFidelityCoverage(providers?: AiLlmTarget[]): FidelityCoverage;
```

### 型

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L15) <code v-pre>packages/ai-llm/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    providers: AiLlmTarget[];
    axes: AiLlmAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/fidelity.ts#L8) <code v-pre>packages/ai-llm/src/semantics/fidelity.ts</code>

```ts
export interface FidelityRow {
    provider: AiLlmTarget;
    axis: AiLlmAxis;
    neutralEvents: NeutralEventName[];
    providerEvents: string[];
}
```
