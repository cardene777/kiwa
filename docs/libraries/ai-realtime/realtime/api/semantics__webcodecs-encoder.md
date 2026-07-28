---
title: "@kiwa-lab/realtime semantics__webcodecs-encoder の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;webcodecs-encoder</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-encoder.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createWebCodecsEncoderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-encoder.ts#L39) <code v-pre>packages/realtime/src/semantics/webcodecs-encoder.ts</code>

```ts
export declare function createWebCodecsEncoderMock(config?: SemanticsMockConfig): WebCodecsEncoderMock;
```

### 型

#### <code v-pre>EncodedFrame</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-encoder.ts#L23) <code v-pre>packages/realtime/src/semantics/webcodecs-encoder.ts</code>

```ts
export interface EncodedFrame {
    encoderId: string;
    frameNumber: number;
    type: 'key' | 'delta';
    byteLength: number;
}
```

#### <code v-pre>EncoderConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-encoder.ts#L15) <code v-pre>packages/realtime/src/semantics/webcodecs-encoder.ts</code>

WebCodecs encoder axis — VideoEncoder / AudioEncoder direct API + hardware acceleration hints. Chrome / Safari / Firefox の WebCodecs 実装は codec config → frame encode → keyframe force → hardware fallback path を持つ。

```ts
export interface EncoderConfig {
    codec: 'H264' | 'VP9' | 'AV1' | 'Opus' | 'AAC';
    width: number;
    height: number;
    bitrate: number;
    hardwareAcceleration: 'prefer-hardware' | 'prefer-software' | 'no-preference';
}
```

#### <code v-pre>WebCodecsEncoderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-encoder.ts#L30) <code v-pre>packages/realtime/src/semantics/webcodecs-encoder.ts</code>

```ts
export interface WebCodecsEncoderMock extends SemanticsMock {
    readonly protocol: 'webcodecs';
    readonly axis: 'webcodecs-encoder';
    configure(input: {
        encoderId: string;
        config: EncoderConfig;
    }): Promise<void>;
    encodeFrame(input: {
        encoderId: string;
        frameNumber: number;
        byteLength: number;
    }): Promise<void>;
    forceKeyframe(input: {
        encoderId: string;
        frameNumber: number;
    }): Promise<void>;
    reportHardwareUsed(input: {
        encoderId: string;
        hardware: boolean;
    }): Promise<void>;
}
```
