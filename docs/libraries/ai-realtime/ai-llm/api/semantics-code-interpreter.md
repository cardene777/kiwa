---
title: "@kiwa-lab/ai-llm semantics-code-interpreter の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>semantics-code-interpreter</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>executeCode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L80) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export declare function executeCode(session: CiSession, input: {
    code: string;
    assigns?: Record<string, string>;
}): {
    step: AxisStep<CiState>;
    execution: CiExecution;
};
```

#### <code v-pre>rollback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L132) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export declare function rollback(session: CiSession, input: {
    steps: number;
}): {
    step: AxisStep<CiState>;
    poppedCount: number;
    remaining: number;
};
```

#### <code v-pre>startCiSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L44) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export declare function startCiSession(input: {
    target: AiLlmTarget;
    sessionId: string;
}): CiSession;
```

#### <code v-pre>startSandbox</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L64) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export declare function startSandbox(session: CiSession, input: {
    sandboxId: string;
    timeoutMs: number;
}): {
    step: AxisStep<CiState>;
    sandboxId: string;
};
```

#### <code v-pre>useTool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L113) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export declare function useTool(session: CiSession, input: {
    name: string;
    args: Record<string, string | number | boolean>;
}): {
    step: AxisStep<CiState>;
    call: CiToolCall;
};
```

### 型

#### <code v-pre>CiExecution</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L19) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export interface CiExecution {
    index: number;
    code: string;
    stdout: string;
    ok: boolean;
}
```

#### <code v-pre>CiSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L32) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export interface CiSession {
    target: AiLlmTarget;
    sessionId: string;
    state: CiState;
    history: AxisStep<CiState>[];
    sandboxId: string | null;
    executions: CiExecution[];
    toolCalls: CiToolCall[];
    memory: Record<string, string>;
    memorySnapshots: Array<Record<string, string>>;
}
```

#### <code v-pre>CiState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L12) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

Code interpreter axis — sandboxed Python REPL + tool use + rollback state machine。 Deterministic mock で 4 signal 系統。 sandbox start binds an isolated cell、 code execution accumulates history and side-effects、 tool use is external effect record、 rollback pops N most-recent executions and restores state。

```ts
export type CiState = 'idle' | 'sandbox-started' | 'code-executed' | 'tool-used' | 'rolled-back';
```

#### <code v-pre>CiToolCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/semantics/code-interpreter.ts#L26) <code v-pre>packages/ai-llm/src/semantics/code-interpreter.ts</code>

```ts
export interface CiToolCall {
    name: string;
    args: Record<string, string | number | boolean>;
    ok: boolean;
}
```
