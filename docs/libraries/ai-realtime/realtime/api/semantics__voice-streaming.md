---
title: "@kiwa-lab/realtime semantics__voice-streaming の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;voice-streaming</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/voice-streaming.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createVoiceStreamingMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/voice-streaming.ts#L37) <code v-pre>packages/realtime/src/semantics/voice-streaming.ts</code>

```ts
export declare function createVoiceStreamingMock(config?: SemanticsMockConfig): VoiceStreamingMock;
```

### 型

#### <code v-pre>VoiceAudioChunk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/voice-streaming.ts#L21) <code v-pre>packages/realtime/src/semantics/voice-streaming.ts</code>

```ts
export interface VoiceAudioChunk {
    sessionId: string;
    sequenceNumber: number;
    byteLength: number;
    durationMs: number;
}
```

#### <code v-pre>VoiceSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/voice-streaming.ts#L15) <code v-pre>packages/realtime/src/semantics/voice-streaming.ts</code>

LLM voice streaming axis — OpenAI Realtime API + Anthropic voice + audio streaming chunk exchange + turn management. session open → audio chunk upload → response chunk stream → turn completed の 4-op flow を mock 化。

```ts
export interface VoiceSession {
    sessionId: string;
    model: string;
    voice: string;
}
```

#### <code v-pre>VoiceStreamingMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/voice-streaming.ts#L28) <code v-pre>packages/realtime/src/semantics/voice-streaming.ts</code>

```ts
export interface VoiceStreamingMock extends SemanticsMock {
    readonly protocol: 'ai-media';
    readonly axis: 'voice-streaming';
    openSession(input: VoiceSession): Promise<void>;
    sendAudioChunk(input: VoiceAudioChunk): Promise<void>;
    receiveResponseChunk(input: VoiceAudioChunk): Promise<void>;
    completeTurn(input: {
        sessionId: string;
        totalDurationMs: number;
    }): Promise<void>;
}
```
