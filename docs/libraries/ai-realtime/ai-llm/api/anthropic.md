---
title: "@kiwa-lab/ai-llm anthropic の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>anthropic</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createAnthropicMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L126) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

```ts
export declare function createAnthropicMock(config?: MockConfig): AnthropicMock;
```

### 型

#### <code v-pre>AnthropicContentBlock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L32) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

Anthropic content block union (v0.2 で image 追加、 real API 準拠)。 text / image は well-typed、 tool_use / tool_result は real SDK の柔軟な shape を保つため field を optional にしてある。 dogfood app が段階的に request を組み立てる経路 (id / name を後で埋める) を許容する。

```ts
export type AnthropicContentBlock = {
    type: 'text';
    text: string;
} | {
    type: 'image';
    source: {
        type: 'base64';
        media_type: string;
        data: string;
    } | {
        type: 'url';
        url: string;
    };
} | {
    type: 'tool_use';
    id?: string;
    name?: string;
    input: Record<string, unknown>;
} | {
    type: 'tool_result';
    tool_use_id: string;
    content: string;
} | {
    type: string;
    text?: string;
    tool_use_id?: string;
    content?: string;
    input?: unknown;
};
```

#### <code v-pre>AnthropicMessagesRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L60) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

```ts
export interface AnthropicMessagesRequest {
    model?: string;
    messages: Array<{
        role: 'user' | 'assistant';
        content: string | AnthropicContentBlock[];
    }>;
    system?: string;
    tools?: Array<{
        name: string;
        description: string;
        input_schema: ToolDefinition['parameters'];
    }>;
    max_tokens?: number;
    temperature?: number;
    stream?: boolean;
}
```

#### <code v-pre>AnthropicMessagesResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L77) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

```ts
export interface AnthropicMessagesResponse {
    id: string;
    type: 'message';
    role: 'assistant';
    model: string;
    content: Array<{
        type: 'text';
        text: string;
    } | {
        type: 'tool_use';
        id: string;
        name: string;
        input: Record<string, unknown>;
    }>;
    stop_reason: 'end_turn' | 'tool_use' | 'max_tokens';
    usage: {
        input_tokens: number;
        output_tokens: number;
        /** cache read / write は Anthropic real API v0.2 で shape 互換保持。 */
        cache_read_input_tokens?: number;
        cache_creation_input_tokens?: number;
    };
    /** kiwa 拡張 — mock 実測 cost / latency を SDK response に添付。 */
    _kiwa: {
        costUsd: number;
        latencyMs: number;
    };
}
```

#### <code v-pre>AnthropicMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L118) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

Anthropic mock client。 real SDK と同じ `messages.create` / `messages.stream` API surface を提供。

```ts
export interface AnthropicMock extends AiLlmMock {
    readonly sdk: 'anthropic';
    messages: {
        create(req: AnthropicMessagesRequest): Promise<AnthropicMessagesResponse>;
        stream(req: AnthropicMessagesRequest): AsyncIterable<AnthropicStreamEvent>;
    };
}
```

#### <code v-pre>AnthropicStreamEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/anthropic.ts#L101) <code v-pre>packages/ai-llm/src/anthropic.ts</code>

```ts
export interface AnthropicStreamEvent {
    type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
    delta?: {
        type: 'text_delta';
        text: string;
    } | {
        stop_reason: string;
    };
    usage?: {
        input_tokens: number;
        output_tokens: number;
    };
    _kiwa?: {
        costUsd: number;
        latencyMs: number;
    };
}
```
