---
title: "@kiwa-lab/realtime semantics__webrtc-data-channel の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;webrtc-data-channel</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-data-channel.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createWebRtcDataChannelMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-data-channel.ts#L57) <code v-pre>packages/realtime/src/semantics/webrtc-data-channel.ts</code>

```ts
export declare function createWebRtcDataChannelMock(config?: SemanticsMockConfig): WebRtcDataChannelMock;
```

### 型

#### <code v-pre>DataChannelHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-data-channel.ts#L42) <code v-pre>packages/realtime/src/semantics/webrtc-data-channel.ts</code>

```ts
export interface DataChannelHandle {
    readonly id: string;
    readonly label: string;
    readonly options: Required<DataChannelOptions>;
    readonly readyState: 'connecting' | 'open' | 'closing' | 'closed';
    send(data: string | ArrayBuffer): Promise<void>;
    close(): Promise<void>;
}
```

#### <code v-pre>DataChannelOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-data-channel.ts#L31) <code v-pre>packages/realtime/src/semantics/webrtc-data-channel.ts</code>

WebRTC data channel axis — ordered / unordered + reliable / unreliable + maxRetransmits + binaryType (arraybuffer / blob) を mock 化する。 実 WebRTC 呼出形式 (`RTCPeerConnection.createDataChannel`) は以下 ... ```ts const dc = pc.createDataChannel('chat', { ordered: true, maxRetransmits: 3, maxPacketLifeTime: null, }); dc.binaryType = 'arraybuffer'; dc.onopen = () =&gt; dc.send('hello'); dc.onmessage = (ev) =&gt; console.log(ev.data); dc.onclose = () =&gt; cleanup(); ``` 本 mock は上記 4 lifecycle event (open / message / close / error) と ordered / maxRetransmits 挙動を deterministic に再現する。

```ts
export interface DataChannelOptions {
    /** default true — 順序保証。 */
    ordered?: boolean;
    /** unordered 時の最大 retransmit 回数 (default 0)。 */
    maxRetransmits?: number;
    /** binary type — arraybuffer / blob (default arraybuffer)。 */
    binaryType?: 'arraybuffer' | 'blob';
    /** label (mock は識別子のみ、 SDK では channel 名として使う)。 */
    label?: string;
}
```

#### <code v-pre>WebRtcDataChannelMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-data-channel.ts#L51) <code v-pre>packages/realtime/src/semantics/webrtc-data-channel.ts</code>

```ts
export interface WebRtcDataChannelMock extends SemanticsMock {
    readonly protocol: 'webrtc';
    readonly axis: 'webrtc-data-channel';
    createDataChannel(options?: DataChannelOptions): DataChannelHandle;
}
```
