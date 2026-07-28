---
title: "@kiwa-lab/ai-llm langchain の API 契約"
---

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>langchain</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createLangchainMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L89) <code v-pre>packages/ai-llm/src/langchain.ts</code>

```ts
export declare function createLangchainMock(config?: MockConfig): LangchainMock;
```

### 型

#### <code v-pre>LangchainAIMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L48) <code v-pre>packages/ai-llm/src/langchain.ts</code>

```ts
export interface LangchainAIMessage {
    /** LangChain の `AIMessage.constructor.name` (mock では固定文字列)。 */
    _type: 'AIMessage';
    content: string;
    tool_calls?: Array<{
        id: string;
        name: string;
        args: Record<string, unknown>;
    }>;
    response_metadata: {
        finish_reason: 'stop' | 'tool_calls' | 'length';
        model: string;
    };
    usage_metadata: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
    };
    _kiwa: {
        costUsd: number;
        latencyMs: number;
    };
}
```

#### <code v-pre>LangchainAIMessageChunk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L72) <code v-pre>packages/ai-llm/src/langchain.ts</code>

```ts
export interface LangchainAIMessageChunk {
    _type: 'AIMessageChunk';
    content: string;
    response_metadata?: LangchainAIMessage['response_metadata'];
    usage_metadata?: LangchainAIMessage['usage_metadata'];
    _kiwa?: LangchainAIMessage['_kiwa'];
}
```

#### <code v-pre>LangchainContentBlock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L28) <code v-pre>packages/ai-llm/src/langchain.ts</code>

LangChain content block (v0.2、 real

```ts
export type LangchainContentBlock = {
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: string | {
        url: string;
        detail?: 'low' | 'high' | 'auto';
    };
} | {
    type: 'media';
    /** base64 data。 */
    data: string;
    mimeType: string;
};
```

#### <code v-pre>LangchainInputMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L41) <code v-pre>packages/ai-llm/src/langchain.ts</code>

```ts
export interface LangchainInputMessage {
    role: 'system' | 'human' | 'ai' | 'tool';
    content: string | LangchainContentBlock[];
    name?: string;
    tool_call_id?: string;
}
```

#### <code v-pre>LangchainMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/langchain.ts#L80) <code v-pre>packages/ai-llm/src/langchain.ts</code>

```ts
export interface LangchainMock extends AiLlmMock {
    readonly sdk: 'langchain';
    invoke(messages: LangchainInputMessage[]): Promise<LangchainAIMessage>;
    stream(messages: LangchainInputMessage[]): AsyncIterable<LangchainAIMessageChunk>;
    batch(batches: LangchainInputMessage[][]): Promise<LangchainAIMessage[]>;
    /** LangChain BaseChatModel は `_llmType()` を実装する。 */
    _llmType(): string;
}
```
