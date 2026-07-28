---
title: "@kiwa-lab/ai-llm engine の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>engine</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/engine.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>MockEngine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/engine.ts#L29) <code v-pre>packages/ai-llm/src/engine.ts</code>

```ts
export declare class MockEngine {
    readonly config: ResolvedConfig;
    constructor(config?: MockConfig);
    /** 1 request の完全な処理 (non-streaming)。 */
    runChat(input: ChatInput): Promise<ChatCompletion>;
    /** streaming — chunk 列を async generator で返す。 */
    runStream(input: ChatInput): AsyncGenerator<StreamEvent, void, unknown>;
    getMetrics(): ReturnType<AiLlmMock['getMetrics']>;
    reset(): void;
}
```


