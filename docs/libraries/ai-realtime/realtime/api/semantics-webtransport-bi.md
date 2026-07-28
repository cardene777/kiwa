---
title: "@kiwa-lab/realtime semantics-webtransport-bi の API 契約"
---

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics-webtransport-bi</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-bi.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createWebTransportBiMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-bi.ts#L49) <code v-pre>packages/realtime/src/semantics/webtransport-bi.ts</code>

```ts
export declare function createWebTransportBiMock(config?: SemanticsMockConfig): WebTransportBiMock;
```

### 型

#### <code v-pre>BiStreamHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-bi.ts#L34) <code v-pre>packages/realtime/src/semantics/webtransport-bi.ts</code>

```ts
export interface BiStreamHandle {
    readonly id: string;
    readonly state: 'open' | 'closed';
    readonly windowRemaining: number;
    write(data: Uint8Array): Promise<void>;
    read(): Promise<Uint8Array | null>;
    close(): Promise<void>;
}
```

#### <code v-pre>BiStreamOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-bi.ts#L29) <code v-pre>packages/realtime/src/semantics/webtransport-bi.ts</code>

WebTransport bi-directional axis — bi stream + flow control + backpressure + close を mock 化する。 実 WebTransport 呼出形式 (`WebTransport.createBidirectionalStream`) は以下 ... ```ts const stream = await transport.createBidirectionalStream(); const writer = stream.writable.getWriter(); await writer.ready; // backpressure — ready 待機 await writer.write(new Uint8Array(1024)); // reader 側 const reader = stream.readable.getReader(); const { value, done } = await reader.read(); ``` 本 mock は上記 4 event (bi-stream-open / write / close / backpressure) と flow control (window size ベース backpressure) を再現する。

```ts
export interface BiStreamOptions {
    /** flow control window size (byte、 default 16384)。 */
    windowSize?: number;
}
```

#### <code v-pre>WebTransportBiMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-bi.ts#L43) <code v-pre>packages/realtime/src/semantics/webtransport-bi.ts</code>

```ts
export interface WebTransportBiMock extends SemanticsMock {
    readonly protocol: 'webtransport';
    readonly axis: 'webtransport-bi';
    createBiStream(options?: BiStreamOptions): Promise<BiStreamHandle>;
}
```
