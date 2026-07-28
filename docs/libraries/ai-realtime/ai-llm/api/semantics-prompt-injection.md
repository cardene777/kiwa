---
title: "@kiwa-lab/ai-llm semantics-prompt-injection の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics-prompt-injection</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>blockJailbreak</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L162) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function blockJailbreak(session: InjectionSession, input: string): {
    step: AxisStep<InjectionState>;
    blocked: boolean;
};
```

#### <code v-pre>blockRoleHijacking</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L179) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function blockRoleHijacking(session: InjectionSession, input: string): {
    step: AxisStep<InjectionState>;
    blocked: boolean;
};
```

#### <code v-pre>classifyDirect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L128) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function classifyDirect(session: InjectionSession, input: string): {
    step: AxisStep<InjectionState>;
    blocked: boolean;
};
```

#### <code v-pre>classifyIndirect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L145) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function classifyIndirect(session: InjectionSession, input: string): {
    step: AxisStep<InjectionState>;
    blocked: boolean;
};
```

#### <code v-pre>detectInjection</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L91) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function detectInjection(session: InjectionSession, input: string): {
    step: AxisStep<InjectionState>;
    detections: InjectionDetection[];
};
```

#### <code v-pre>startInjectionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L42) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export declare function startInjectionSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): InjectionSession;
```

### 型

#### <code v-pre>InjectionDetection</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L35) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export interface InjectionDetection {
    kind: InjectionKind;
    confidence: number;
    excerpt: string;
    matchedPattern: string;
}
```

#### <code v-pre>InjectionKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L12) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

Prompt injection defense axis — direct + indirect + jailbreak + role hijacking + XML injection detection state machine。 Deterministic mock で 5 signal 系統を提供 (pattern-based classifier)。 real driver 経路では実 LLM に対し injection payload を投げて refusal を 観測する。

```ts
export type InjectionKind = 'direct' | 'indirect' | 'jailbreak' | 'role-hijacking' | 'xml-injection';
```

#### <code v-pre>InjectionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L27) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export interface InjectionSession {
    target: AiLlmTarget;
    sessionId: string;
    state: InjectionState;
    history: AxisStep<InjectionState>[];
    detections: Array<{
        kind: InjectionKind;
        confidence: number;
        excerpt: string;
    }>;
}
```

#### <code v-pre>InjectionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/prompt-injection.ts#L19) <code v-pre>packages/ai-llm/src/semantics/prompt-injection.ts</code>

```ts
export type InjectionState = 'idle' | 'analyzed' | 'direct-detected' | 'indirect-detected' | 'jailbreak-blocked' | 'role-hijacking-blocked';
```
