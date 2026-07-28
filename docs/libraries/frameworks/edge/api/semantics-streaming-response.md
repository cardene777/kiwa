---
title: "@kiwa-lab/edge semantics-streaming-response の API 契約"
---

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics-streaming-response</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>closeStream</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L136) <code v-pre>packages/edge/src/semantics/streaming-response.ts</code>

Close the stream. Transitions to `closed` and emits `stream.closed` with the final chunk + byte totals. Rejects if the stream is already `closed`.

```ts
export declare function closeStream(session: StreamSession, input: {
    reason: string;
}): AxisStep<StreamState>;
```

#### <code v-pre>openStream</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L30) <code v-pre>packages/edge/src/semantics/streaming-response.ts</code>

Open a response stream. `kind` defaults to `chunked` and `highWaterMark` to 65536 bytes (64 KiB). Emits `stream.opened` and seeds counters at zero.

```ts
export declare function openStream(input: {
    id: string;
    platform: EdgePlatform;
    kind?: StreamKind;
    highWaterMark?: number;
}): StreamSession;
```

#### <code v-pre>resumeStream</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L111) <code v-pre>packages/edge/src/semantics/streaming-response.ts</code>

Resume a back-pressured stream after the consumer drained. Transitions `backpressure` → `open`, drains one high-water mark worth of buffered bytes, and re-emits `stream.chunk-sent` tagged `resumed: true` (there is no distinct neutral resume event). Rejects unless the stream is `backpressure`.

```ts
export declare function resumeStream(session: StreamSession): AxisStep<StreamState>;
```

#### <code v-pre>sendChunk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L65) <code v-pre>packages/edge/src/semantics/streaming-response.ts</code>

Write a chunk to the stream. Advances `chunksSent` + `bytesSent`; when the buffered byte total exceeds the high-water mark the stream flips to `backpressure` and emits `stream.backpressure`, otherwise `stream.chunk-sent`. Rejects if the stream is already `closed`.

```ts
export declare function sendChunk(session: StreamSession, input: {
    data: string;
}): AxisStep<StreamState>;
```

### 型

#### <code v-pre>StreamKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L13) <code v-pre>packages/edge/src/semantics/streaming-response.ts</code>

Delivery mechanism for the streamed body.

```ts
export type StreamKind = 'chunked' | 'sse' | 'websocket';
```

#### <code v-pre>StreamSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L15) <code v-pre>packages/edge/src/semantics/streaming-response.ts</code>

```ts
export interface StreamSession {
    id: string;
    platform: EdgePlatform;
    kind: StreamKind;
    state: StreamState;
    chunksSent: number;
    bytesSent: number;
    highWaterMark: number;
    history: AxisStep<StreamState>[];
}
```

#### <code v-pre>StreamState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L10) <code v-pre>packages/edge/src/semantics/streaming-response.ts</code>

Streaming response — chunked / SSE / websocket body delivery with backpressure. Edge runtimes stream responses through a bounded buffer: while buffered bytes stay under the high-water mark the stream is `open` and chunks flow freely; once the mark is exceeded the stream enters `backpressure` and the producer must wait for the consumer to drain before resuming.

```ts
export type StreamState = 'open' | 'backpressure' | 'closed';
```
