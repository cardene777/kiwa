---
title: "@kiwa-lab/realtime semantics__whisper-streaming の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;whisper-streaming</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/whisper-streaming.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createWhisperStreamingMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/whisper-streaming.ts#L32) <code v-pre>packages/realtime/src/semantics/whisper-streaming.ts</code>

```ts
export declare function createWhisperStreamingMock(config?: SemanticsMockConfig): WhisperStreamingMock;
```

### 型

#### <code v-pre>WhisperStreamingMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/whisper-streaming.ts#L23) <code v-pre>packages/realtime/src/semantics/whisper-streaming.ts</code>

```ts
export interface WhisperStreamingMock extends SemanticsMock {
    readonly protocol: 'ai-media';
    readonly axis: 'whisper-streaming';
    sendAudioChunk(input: {
        streamId: string;
        byteLength: number;
        durationMs: number;
    }): Promise<void>;
    emitPartialTranscript(input: WhisperTranscript): Promise<void>;
    emitFinalTranscript(input: WhisperTranscript): Promise<void>;
    triggerVad(input: {
        streamId: string;
        type: 'start' | 'end';
        timestampMs: number;
    }): Promise<void>;
}
```

#### <code v-pre>WhisperTranscript</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/whisper-streaming.ts#L15) <code v-pre>packages/realtime/src/semantics/whisper-streaming.ts</code>

Whisper streaming ASR axis — Whisper streaming API (OpenAI + local WhisperCPP) + partial transcript + Voice Activity Detection (VAD) trigger。 partial transcript は音声区切りごと、 final transcript は VAD end で確定。

```ts
export interface WhisperTranscript {
    streamId: string;
    text: string;
    startMs: number;
    endMs: number;
    confidence: number;
}
```
