---
title: "@kiwa-lab/ai-llm openai の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>openai</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createOpenAIMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L182) <code v-pre>packages/ai-llm/src/openai.ts</code>

```ts
export declare function createOpenAIMock(config?: MockConfig): OpenAiMock;
```

### 型

#### <code v-pre>OpenAiChatCompletionsRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L46) <code v-pre>packages/ai-llm/src/openai.ts</code>

```ts
export interface OpenAiChatCompletionsRequest {
    model?: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant' | 'tool';
        content: string | OpenAiContentPart[] | null;
        tool_calls?: Array<{
            id: string;
            type: 'function';
            function: {
                name: string;
                arguments: string;
            };
        }>;
        tool_call_id?: string;
        name?: string;
    }>;
    tools?: Array<{
        type: 'function';
        function: {
            name: string;
            description: string;
            parameters: Record<string, unknown>;
        };
    }>;
    max_tokens?: number;
    temperature?: number;
    stream?: boolean;
}
```

#### <code v-pre>OpenAiChatCompletionsResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L72) <code v-pre>packages/ai-llm/src/openai.ts</code>

```ts
export interface OpenAiChatCompletionsResponse {
    id: string;
    object: 'chat.completion';
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: 'assistant';
            content: string | null;
            tool_calls?: Array<{
                id: string;
                type: 'function';
                function: {
                    name: string;
                    arguments: string;
                };
            }>;
        };
        finish_reason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    _kiwa: {
        costUsd: number;
        latencyMs: number;
    };
}
```

#### <code v-pre>OpenAiContentPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L26) <code v-pre>packages/ai-llm/src/openai.ts</code>

OpenAI vision / audio content part (v0.2、 real Chat Completions vision + gpt-4o audio input 準拠)。

```ts
export type OpenAiContentPart = {
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: {
        /** `data:image/jpeg;base64,{...}` or `https://...`。 */
        url: string;
        /** OpenAI vision resolution hint。 */
        detail?: 'low' | 'high' | 'auto';
    };
} | {
    type: 'input_audio';
    input_audio: {
        data: string;
        /** `wav` / `mp3` 等。 */
        format: string;
    };
};
```

#### <code v-pre>OpenAiMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L158) <code v-pre>packages/ai-llm/src/openai.ts</code>

```ts
export interface OpenAiMock extends AiLlmMock {
    readonly sdk: 'openai';
    chat: {
        completions: {
            create(req: OpenAiChatCompletionsRequest): Promise<OpenAiChatCompletionsResponse> | AsyncIterable<OpenAiStreamChunk>;
        };
    };
    /** Whisper audio transcription mock (v0.2)。 */
    audio: {
        transcriptions: {
            create(req: OpenAiTranscriptionRequest): Promise<OpenAiTranscriptionJson | OpenAiTranscriptionVerboseJson>;
        };
    };
    /**
     * kiwa 統一 API — audio → transcription を SDK 表面と別に露出。
     * fidelity harness / non-OpenAI 経路から呼びやすくする。
     */
    transcribeAudio(source: {
        kind: 'base64' | 'url';
        data?: string;
        url?: string;
        mediaType?: string;
    }): Promise<TranscriptionResult>;
}
```

#### <code v-pre>OpenAiStreamChunk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L100) <code v-pre>packages/ai-llm/src/openai.ts</code>

```ts
export interface OpenAiStreamChunk {
    id: string;
    object: 'chat.completion.chunk';
    model: string;
    choices: Array<{
        index: number;
        delta: {
            role?: 'assistant';
            content?: string;
            tool_calls?: Array<{
                index: number;
                id?: string;
                type?: 'function';
                function?: {
                    name?: string;
                    arguments?: string;
                };
            }>;
        };
        finish_reason: 'stop' | 'tool_calls' | null;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    _kiwa?: {
        costUsd: number;
        latencyMs: number;
    };
}
```

#### <code v-pre>OpenAiTranscriptionJson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L140) <code v-pre>packages/ai-llm/src/openai.ts</code>

Whisper transcription response (`json` 相当)。

```ts
export interface OpenAiTranscriptionJson {
    text: string;
    /** kiwa 拡張。 */
    _kiwa: {
        costUsd: number;
        latencyMs: number;
    };
}
```

#### <code v-pre>OpenAiTranscriptionRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L130) <code v-pre>packages/ai-llm/src/openai.ts</code>

Whisper transcription request (real `client.audio.transcriptions.create` の shape 準拠)。 file は base64 data URL or URL string で受ける。

```ts
export interface OpenAiTranscriptionRequest {
    /** base64 data (`data:audio/wav;base64,...`) or URL (`https://.../audio.wav`)。 */
    file: string;
    model?: string;
    /** `json` = text のみ、 `verbose_json` = segments 込。 default 'json'。 */
    response_format?: 'json' | 'verbose_json' | 'text';
    language?: string;
}
```

#### <code v-pre>OpenAiTranscriptionVerboseJson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts#L147) <code v-pre>packages/ai-llm/src/openai.ts</code>

Whisper transcription response (`verbose_json` 相当)。

```ts
export interface OpenAiTranscriptionVerboseJson extends OpenAiTranscriptionJson {
    language: string;
    duration: number;
    segments: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
    }>;
}
```
