---
title: "@kiwa-lab/ai-llm types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>AiLlmMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L163) <code v-pre>packages/ai-llm/src/types.ts</code>

kiwa mock を全 SDK adapter が満たすべき最小 interface。 SDK 固有の API (`messages.create` / `chat.completions.create` / `generateText` / `invoke` 等) は adapter 別に定義、 本 interface は 4 SDK 共通の低レベル呼出だけ を集約する。 `chatCompletion` = non-streaming、 `chatStream` = SSE 相当の async iterable。 SDK 表面の名前 (`chat` / `stream`) と衝突しないよう prefix を付ける。

```ts
export interface AiLlmMock {
    /** SDK 名 (`anthropic` / `openai` / `vercel-ai` / `langchain`)。 */
    readonly sdk: string;
    chatCompletion(input: ChatInput): Promise<ChatCompletion>;
    chatStream(input: ChatInput): AsyncIterable<StreamEvent>;
    /** 累積の cost / token / latency を返す (fidelity 計測用)。 */
    getMetrics(): {
        totalCostUsd: number;
        totalTokens: Usage;
        latencySamplesMs: number[];
        requests: number;
    };
    /** metric 状態を初期化する。 */
    reset(): void;
}
```

#### <code v-pre>ChatCompletion</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L78) <code v-pre>packages/ai-llm/src/types.ts</code>

1 回の chat request 結果 (non-streaming)。

```ts
export interface ChatCompletion {
    /** assistant 生成 message (通常 role='assistant')。 */
    message: ChatMessage;
    usage: Usage;
    /** 実測 US$ (mock は固定 rate、 real は SDK 実測)。 */
    costUsd: number;
    /** 実測 latency (ms、 mock は artificial delay、 real は wall clock)。 */
    latencyMs: number;
    /** stop / tool_use / length など終了理由。 */
    finishReason: 'stop' | 'tool_use' | 'length' | 'content_filter';
}
```

#### <code v-pre>ChatInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L180) <code v-pre>packages/ai-llm/src/types.ts</code>

chat / stream 共通の入力。

```ts
export interface ChatInput {
    messages: ChatMessage[];
    tools?: ToolDefinition[];
    /** temperature / topP / maxTokens 等 provider 共通の hint。 */
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
}
```

#### <code v-pre>ChatMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L31) <code v-pre>packages/ai-llm/src/types.ts</code>

Provider agnostic chat message。 tool_call / tool_result は `toolCalls` / `toolCallId` field で表現する。 v0.2 (Issue #746) で multimodal 対応追加。 `parts` optional field に image / audio を含む `MessagePart[]` を渡せる。 `parts` 指定時は adapter が SDK 固有の image/audio shape に変換、 未指定時は従来通り `content: string` を使う (完全後方互換)。

```ts
export interface ChatMessage {
    role: MessageRole;
    content: string;
    /**
     * multimodal input — image / audio / text を混在させる場合の順序保持
     * 配列。 未指定時は従来通り `content: string` のみで処理。
     */
    parts?: import('./multimodal.js').MessagePart[];
    /** assistant message が tool_use を持つ場合の呼出 payload。 */
    toolCalls?: ToolCall[];
    /** role === 'tool' のとき、 元の tool_call を紐付ける id。 */
    toolCallId?: string;
    /** tool 名 (role === 'tool' のとき使用)。 */
    name?: string;
}
```

#### <code v-pre>MessageRole</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L14) <code v-pre>packages/ai-llm/src/types.ts</code>

Chat message role — 4 SDK 全てで共通。

```ts
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
```

#### <code v-pre>MockConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L114) <code v-pre>packages/ai-llm/src/types.ts</code>

Mock 設定。 4 SDK adapter で共通に使う。 `responses` は user プロンプトを完全一致で index、 hit なしは `defaultResponse` を返す。 tool_calls / streaming も `responses` で 制御 (同じ user prompt に対し tool_use → 次 turn で最終応答、 等の multi-turn シナリオも表現可能)。 v0.2 (Issue #746) で multimodal 対応追加。 - `transcriptions` = audio → text の期待値 dict (Whisper mock)。 - `imageTokenCost` / `audioTokenCost` = multimodal token 計算 override。

```ts
export interface MockConfig {
    /** default response (dict miss 時のフォールバック)。 */
    defaultResponse?: string;
    /** user prompt → mock 応答 (順序 = 呼出順)。 */
    responses?: Record<string, MockResponse>;
    /** artificial latency in ms (default 10)。 */
    artificialLatencyMs?: number;
    /**
     * cost per 1k tokens ($US)。 default は Anthropic Haiku 相当の
     * `{ prompt: 0.00025, completion: 0.00125 }`。
     */
    costPer1kTokens?: {
        prompt: number;
        completion: number;
    };
    /** provider / model 識別子 (report 用、 default 'mock-model')。 */
    model?: string;
    /**
     * Whisper transcription 期待値。 key は `toTranscriptionKey(source)` 形式
     * (`base64:{hash}` or `url:{url}`)。 hit なしは `defaultTranscription` へ。
     */
    transcriptions?: Record<string, import('./multimodal.js').MockTranscription>;
    /** transcription dict miss 時の fallback (未指定 = 'transcribed audio')。 */
    defaultTranscription?: string;
    /** image 1 件あたりの prompt token 換算 (default 1500)。 */
    imageTokenCost?: number;
    /** audio 1 件あたりの prompt token 換算 (default 500、 durationSeconds > 30 で比例増分)。 */
    audioTokenCost?: number;
}
```

#### <code v-pre>MockResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L142) <code v-pre>packages/ai-llm/src/types.ts</code>

MockConfig.responses の 1 entry。

```ts
export interface MockResponse {
    content: string;
    /** tool_use を返す場合の呼出定義。 */
    toolCalls?: ToolCall[];
    /** stream で送出する chunk 列 (未指定 = content を 1 chunk で送出)。 */
    chunks?: string[];
    /** token 使用量の override (未指定 = 文字数 / 4 で概算)。 */
    usage?: Partial<Usage>;
    /** finishReason の override (default 'stop'、 toolCalls 有りは 'tool_use')。 */
    finishReason?: ChatCompletion['finishReason'];
}
```

#### <code v-pre>StreamEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L91) <code v-pre>packages/ai-llm/src/types.ts</code>

streaming で観測される 1 event (delta)。

```ts
export interface StreamEvent {
    /** 差分文字列 (finish 時は空文字列)。 */
    delta: string;
    /** stream 終了 event。 */
    done: boolean;
    /** stream 終了時のみ設定される最終 usage / cost。 */
    usage?: Usage;
    costUsd?: number;
    latencyMs?: number;
}
```

#### <code v-pre>ToolCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L63) <code v-pre>packages/ai-llm/src/types.ts</code>

Assistant が生成する tool_use / function_call の統一表現。

```ts
export interface ToolCall {
    id: string;
    name: string;
    /** arguments は JSON.stringify 済の文字列で保持する。 */
    arguments: string;
}
```

#### <code v-pre>ToolDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L51) <code v-pre>packages/ai-llm/src/types.ts</code>

Tool 定義 — 4 SDK で shape が違うため、 本 harness では JSON Schema ベースの共通形式で保持する。

```ts
export interface ToolDefinition {
    name: string;
    description: string;
    /** JSON Schema (subset)。 */
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description?: string;
        }>;
        required?: string[];
    };
}
```

#### <code v-pre>Usage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/types.ts#L71) <code v-pre>packages/ai-llm/src/types.ts</code>

LLM 呼出の token 使用量。

```ts
export interface Usage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
```
