---
title: "@kiwa-lab/ai-llm semantics-guardrails の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics-guardrails</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>blockToxicity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L149) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function blockToxicity(session: GuardrailSession, input: {
    text: string;
    threshold?: number;
}): {
    step: AxisStep<GuardrailState>;
    blocked: boolean;
    score: number;
};
```

#### <code v-pre>checkConstitutional</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L212) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function checkConstitutional(session: GuardrailSession, input: {
    text: string;
    principles: ConstitutionalPrinciple[];
}): {
    step: AxisStep<GuardrailState>;
    violations: Array<{
        id: string;
        word: string;
    }>;
};
```

#### <code v-pre>matchRegex</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L116) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function matchRegex(session: GuardrailSession, input: {
    text: string;
    patterns: RegExp[];
    mode: 'allow' | 'deny';
}): {
    step: AxisStep<GuardrailState>;
    passed: boolean;
    hits: string[];
};
```

#### <code v-pre>redactPii</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L187) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function redactPii(session: GuardrailSession, text: string): {
    step: AxisStep<GuardrailState>;
    redacted: string;
    hits: Array<{
        kind: string;
        count: number;
    }>;
};
```

#### <code v-pre>startGuardrailSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L44) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function startGuardrailSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): GuardrailSession;
```

#### <code v-pre>validateSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L59) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export declare function validateSchema(session: GuardrailSession, input: {
    value: unknown;
    schema: SimpleSchema;
}): {
    step: AxisStep<GuardrailState>;
    valid: boolean;
    errors: string[];
};
```

### 型

#### <code v-pre>ConstitutionalPrinciple</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L38) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export interface ConstitutionalPrinciple {
    id: string;
    ruleText: string;
    forbidden: string[];
}
```

#### <code v-pre>GuardrailSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L16) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export interface GuardrailSession {
    target: AiLlmTarget;
    sessionId: string;
    state: GuardrailState;
    history: AxisStep<GuardrailState>[];
}
```

#### <code v-pre>GuardrailState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L8) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

Guardrails axis — JSON schema + regex + toxicity + PII + Constitutional AI state machine。 deterministic mock で 5 signal 系統を提供。

```ts
export type GuardrailState = 'idle' | 'schema-validated' | 'regex-matched' | 'toxicity-blocked' | 'pii-redacted' | 'constitutional-checked';
```

#### <code v-pre>SimpleSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L32) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export interface SimpleSchema {
    type: 'object';
    properties: Record<string, SimpleSchemaProperty>;
    required?: string[];
}
```

#### <code v-pre>SimpleSchemaProperty</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/guardrails.ts#L23) <code v-pre>packages/ai-llm/src/semantics/guardrails.ts</code>

```ts
export interface SimpleSchemaProperty {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    enum?: Array<string | number | boolean>;
}
```
