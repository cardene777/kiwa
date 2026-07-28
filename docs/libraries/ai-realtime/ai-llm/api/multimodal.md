---
title: "@kiwa-lab/ai-llm multimodal の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>multimodal</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>estimateMultimodalTokens</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L141) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

parts に含まれる image / audio の token 換算量を返す。 token 見積の内訳は `imageTokenCost` (default 1500) × image 数 + `audioTokenCost` (default 500) × audio 数 (durationSeconds &gt; 30 の場合は比例増分)。 detail hint は OpenAI vision の課金モデルに寄せて low = 1/2、 high = 実額、 auto = 実額の 0.8 を掛ける。

```ts
export declare function estimateMultimodalTokens(parts: MessagePart[] | undefined, config?: {
    imageTokenCost?: number;
    audioTokenCost?: number;
}): number;
```

#### <code v-pre>extractTextFromParts</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L126) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

parts から text 部分だけを結合 (adapter が下位 engine に渡す用)。

```ts
export declare function extractTextFromParts(parts: MessagePart[]): string;
```

#### <code v-pre>hasAudioPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L181) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

「audio 1 件以上を含む parts」 の shape guard。

```ts
export declare function hasAudioPart(parts: MessagePart[] | undefined): boolean;
```

#### <code v-pre>hasImagePart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L175) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

「image 1 件以上を含む parts」 の shape guard。 adapter の分岐用。

```ts
export declare function hasImagePart(parts: MessagePart[] | undefined): boolean;
```

#### <code v-pre>hasMultimodalParts</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L120) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

`parts` に image / audio が 1 件でも含まれるか。

```ts
export declare function hasMultimodalParts(parts: MessagePart[] | undefined): boolean;
```

#### <code v-pre>toTranscriptionKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L167) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

audio part を transcription key に変換 (mock dict lookup 用)。 base64 は `base64:{先頭 32 文字}`、 url は `url:{url}` を使う。 先頭 32 文字 hash は 「同じ audio を渡せば同じ key」 を担保する軽量 fingerprint。

```ts
export declare function toTranscriptionKey(source: MediaSource): string;
```

### 型

#### <code v-pre>AudioPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L66) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

Audio 入力 (Whisper transcription や OpenAI audio input で使用)。

```ts
export interface AudioPart {
    type: 'audio';
    source: MediaSource;
    /** 音声 duration の秒数 hint (mock token 計算に使用、 未指定は 10s と仮定)。 */
    durationSeconds?: number;
    /**
     * `chat` = OpenAI Chat Completions の `input_audio` (音声を chat context に
     * 差し込む) / `transcription` = Whisper 単発 transcription 用。
     * default `chat`。
     */
    purpose?: 'chat' | 'transcription';
}
```

#### <code v-pre>Base64Data</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L34) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

base64 data + media type、 real API と shape 整合。

```ts
export interface Base64Data {
    kind: 'base64';
    /** MIME type (`image/jpeg` / `image/png` / `image/webp` / `audio/wav` / `audio/mpeg` 等)。 */
    mediaType: string;
    /** base64 encoded payload (data URI prefix なし)。 */
    data: string;
}
```

#### <code v-pre>ImagePart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L58) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

Image 入力。 detail は OpenAI vision の resolution hint と互換。

```ts
export interface ImagePart {
    type: 'image';
    source: MediaSource;
    /** OpenAI vision detail hint (default 'auto')。 mock は token 計算に反映。 */
    detail?: 'low' | 'high' | 'auto';
}
```

#### <code v-pre>MediaSource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L49) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

Image / Audio の source 表現統一。

```ts
export type MediaSource = Base64Data | UrlData;
```

#### <code v-pre>MessagePart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L80) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

MessagePart union — chat message の 1 sub-block。

```ts
export type MessagePart = TextPart | ImagePart | AudioPart;
```

#### <code v-pre>MockTranscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L87) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

1 audio 入力に対する transcription 期待値。 `MockConfig.transcriptions` の dict value 型。 audio id は Base64 source なら `base64:{hash}` / URL source なら `url:{url}` を lookup key とする。

```ts
export interface MockTranscription {
    /** 転写結果 text。 */
    text: string;
    /** 認識言語 (ISO-639-1、 未指定 = 'en')。 */
    language?: string;
    /** verbose_json mode 用 segments (mock は 1 segment fallback)。 */
    segments?: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
    }>;
}
```

#### <code v-pre>TextPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L52) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

text-only 分岐 (parts 混在時の従来 text 表現)。

```ts
export interface TextPart {
    type: 'text';
    text: string;
}
```

#### <code v-pre>TranscriptionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L102) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

Whisper 1 回分の transcription 結果 (real API shape 互換)。

```ts
export interface TranscriptionResult {
    text: string;
    language: string;
    durationSeconds: number;
    segments: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
    }>;
    /** kiwa 拡張 — mock 実測 cost / latency。 */
    _kiwa: {
        costUsd: number;
        latencyMs: number;
    };
}
```

#### <code v-pre>UrlData</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts#L43) <code v-pre>packages/ai-llm/src/multimodal.ts</code>

URL 参照、 4 SDK 全部で fetch 経路がある。

```ts
export interface UrlData {
    kind: 'url';
    url: string;
}
```
