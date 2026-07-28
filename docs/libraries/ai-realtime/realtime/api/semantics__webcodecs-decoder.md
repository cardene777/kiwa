---
title: "@kiwa-lab/realtime semantics__webcodecs-decoder の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;webcodecs-decoder</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-decoder.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createWebCodecsDecoderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-decoder.ts#L29) <code v-pre>packages/realtime/src/semantics/webcodecs-decoder.ts</code>

```ts
export declare function createWebCodecsDecoderMock(config?: SemanticsMockConfig): WebCodecsDecoderMock;
```

### 型

#### <code v-pre>DecoderConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-decoder.ts#L15) <code v-pre>packages/realtime/src/semantics/webcodecs-decoder.ts</code>

WebCodecs decoder axis — VideoDecoder / AudioDecoder + frame buffer + reorder + drop policy. B-frame や out-of-order 到着に対応する reorder buffer + latency budget 超過時の drop path を含む。

```ts
export interface DecoderConfig {
    codec: 'H264' | 'VP9' | 'AV1' | 'Opus' | 'AAC';
    description?: string;
}
```

#### <code v-pre>WebCodecsDecoderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-decoder.ts#L20) <code v-pre>packages/realtime/src/semantics/webcodecs-decoder.ts</code>

```ts
export interface WebCodecsDecoderMock extends SemanticsMock {
    readonly protocol: 'webcodecs';
    readonly axis: 'webcodecs-decoder';
    configure(input: {
        decoderId: string;
        config: DecoderConfig;
    }): Promise<void>;
    decodeFrame(input: {
        decoderId: string;
        frameNumber: number;
        type: 'key' | 'delta';
    }): Promise<void>;
    reorderFrame(input: {
        decoderId: string;
        frameNumber: number;
        delayMs: number;
    }): Promise<void>;
    dropFrame(input: {
        decoderId: string;
        frameNumber: number;
        reason: string;
    }): Promise<void>;
}
```
