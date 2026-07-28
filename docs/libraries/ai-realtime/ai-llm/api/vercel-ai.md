---
title: "@kiwa-lab/ai-llm vercel-ai の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>vercel-ai</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createVercelAiMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L97) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

```ts
export declare function createVercelAiMock(config?: MockConfig): VercelAiMock;
```

### 型

#### <code v-pre>VercelAiMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L91) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

```ts
export interface VercelAiMock extends AiLlmMock {
    readonly sdk: 'vercel-ai';
    generateText(req: VercelAiRequest): Promise<VercelGenerateTextResult>;
    streamText(req: VercelAiRequest): VercelStreamTextResult;
}
```

#### <code v-pre>VercelAiRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L44) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

```ts
export interface VercelAiRequest {
    messages: Array<{
        role: 'system' | 'user' | 'assistant' | 'tool';
        content: string | VercelContentPart[];
    }>;
    system?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: Record<string, {
        description: string;
        parameters: Record<string, unknown>;
    }>;
}
```

#### <code v-pre>VercelContentPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L28) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

Vercel AI SDK v3+ multimodal content part (v0.2、 real SDK 準拠)。 SDK は `content: string` + `content: Array&lt;{type:'text'|'image', ...}&gt;` の 両方を受け入れる。 image は URL string or Uint8Array or base64 string。

```ts
export type VercelContentPart = {
    type: 'text';
    text: string;
} | {
    type: 'image';
    /** URL string or base64 string or data URI。 mock は URL / base64 のみ扱う。 */
    image: string;
    /** mediaType hint。 */
    mimeType?: string;
} | {
    type: 'file';
    /** audio / image / pdf 汎用 file (Vercel AI v4)、 mock は audio として扱う。 */
    data: string;
    mimeType: string;
};
```

#### <code v-pre>VercelGenerateTextResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L61) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

```ts
export interface VercelGenerateTextResult {
    text: string;
    toolCalls: Array<{
        toolCallId: string;
        toolName: string;
        args: Record<string, unknown>;
    }>;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: 'stop' | 'tool-calls' | 'length' | 'content-filter';
    _kiwa: {
        costUsd: number;
        latencyMs: number;
    };
}
```

#### <code v-pre>VercelStreamTextResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/vercel-ai.ts#L80) <code v-pre>packages/ai-llm/src/vercel-ai.ts</code>

```ts
export interface VercelStreamTextResult {
    /** 逐次 text chunk を送出する async iterable。 */
    textStream: AsyncIterable<string>;
    /** 全 stream 完了後の最終 text (resolve 順は SDK と同じで stream 後)。 */
    text: Promise<string>;
    /** stream 完了後 resolve される usage。 */
    usage: Promise<VercelGenerateTextResult['usage']>;
    finishReason: Promise<VercelGenerateTextResult['finishReason']>;
    _kiwa: Promise<{
        costUsd: number;
        latencyMs: number;
    }>;
}
```
