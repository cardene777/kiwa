---
title: "@kiwa-lab/realtime semantics__webtransport-uni の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;webtransport-uni</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-uni.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createWebTransportUniMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-uni.ts#L49) <code v-pre>packages/realtime/src/semantics/webtransport-uni.ts</code>

```ts
export declare function createWebTransportUniMock(config?: SemanticsMockConfig): WebTransportUniMock;
```

### 型

#### <code v-pre>UniStreamHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-uni.ts#L33) <code v-pre>packages/realtime/src/semantics/webtransport-uni.ts</code>

WebTransport uni-directional axis — uni stream + Datagram + reset stream を mock 化する。 実 WebTransport 呼出形式 (`WebTransport.createUnidirectionalStream` + `datagrams.writable`) は以下 ... ```ts const transport = new WebTransport('https://example.com/wt'); await transport.ready; // uni stream const stream = await transport.createUnidirectionalStream(); const writer = stream.getWriter(); await writer.write(new Uint8Array([1, 2, 3])); writer.close(); // datagram const dgramWriter = transport.datagrams.writable.getWriter(); await dgramWriter.write(new Uint8Array([9, 8, 7])); ``` 本 mock は上記 4 event (uni-stream-open / write / reset / datagram-recv) を 再現する。 stream reset は abort() 相当。

```ts
export interface UniStreamHandle {
    readonly id: string;
    readonly state: 'open' | 'reset' | 'closed';
    write(data: Uint8Array): Promise<void>;
    close(): Promise<void>;
    /** stream を強制 reset (WebTransport writer.abort() 相当)。 */
    reset(errorCode: number): Promise<void>;
}
```

#### <code v-pre>WebTransportUniMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-uni.ts#L42) <code v-pre>packages/realtime/src/semantics/webtransport-uni.ts</code>

```ts
export interface WebTransportUniMock extends SemanticsMock {
    readonly protocol: 'webtransport';
    readonly axis: 'webtransport-uni';
    createUniStream(): Promise<UniStreamHandle>;
    sendDatagram(data: Uint8Array): Promise<void>;
}
```
