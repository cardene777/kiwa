---
title: "@kiwa-lab/realtime semantics__quic-multiplex の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;quic-multiplex</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createQuicMultiplexMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L61) <code v-pre>packages/realtime/src/semantics/quic-multiplex.ts</code>

```ts
export declare function createQuicMultiplexMock(config?: SemanticsMockConfig & {
    enable0RTT?: boolean;
}): QuicMultiplexMock;
```

### 型

#### <code v-pre>HpackEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L41) <code v-pre>packages/realtime/src/semantics/quic-multiplex.ts</code>

```ts
export interface HpackEntry {
    name: string;
    value: string;
    /** 挿入順 (dynamic table index)。 */
    index: number;
}
```

#### <code v-pre>QuicMultiplexMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L48) <code v-pre>packages/realtime/src/semantics/quic-multiplex.ts</code>

```ts
export interface QuicMultiplexMock extends SemanticsMock {
    readonly protocol: 'http3-quic';
    readonly axis: 'quic-multiplex';
    readonly zeroRttEnabled: boolean;
    readonly hpackTableSize: number;
    openStream(options?: QuicStreamOptions): Promise<QuicStreamHandle>;
    insertHpackHeader(name: string, value: string): Promise<HpackEntry>;
    /** 0-RTT で resume (以前の session ticket があると想定)。 */
    resumeWithZeroRtt(): Promise<void>;
    /** 現在 open な stream を priority 順に返す (低い値 = 高優先)。 */
    getActiveStreams(): QuicStreamHandle[];
}
```

#### <code v-pre>QuicStreamHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L34) <code v-pre>packages/realtime/src/semantics/quic-multiplex.ts</code>

```ts
export interface QuicStreamHandle {
    readonly id: string;
    readonly priority: number;
    readonly state: 'open' | 'closed';
    close(): Promise<void>;
}
```

#### <code v-pre>QuicStreamOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L29) <code v-pre>packages/realtime/src/semantics/quic-multiplex.ts</code>

QUIC multiplex axis — stream multiplex + stream priority + HPACK dynamic table + 0-RTT を mock 化する。 実 QUIC (HTTP/3 下層) 呼出形式 (aioquic / quiche / ngtcp2 相当) は以下 ... ```ts // client 側 (aioquic 相当の JS 表現) const conn = new QuicConnection({ enable0RTT: true }); await conn.handshake(); const stream1 = conn.openStream({ priority: 3 }); const stream2 = conn.openStream({ priority: 5 }); // HPACK dynamic table 更新 conn.hpack.insertHeader('content-type', 'application/json'); ``` 本 mock は上記 4 event (stream-open / stream-close / hpack-insert / zero-rtt-used) と stream priority (低い数字が高優先) を再現する。

```ts
export interface QuicStreamOptions {
    /** priority (0=最高、 255=最低、 default 128)。 */
    priority?: number;
}
```
