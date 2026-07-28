---
title: "@kiwa-lab/realtime semantics__webrtc-signaling の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;webrtc-signaling</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-signaling.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createWebRtcSignalingMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-signaling.ts#L65) <code v-pre>packages/realtime/src/semantics/webrtc-signaling.ts</code>

```ts
export declare function createWebRtcSignalingMock(config?: SemanticsMockConfig): WebRtcSignalingMock;
```

### 型

#### <code v-pre>IceCandidate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-signaling.ts#L42) <code v-pre>packages/realtime/src/semantics/webrtc-signaling.ts</code>

ICE candidate 1 件 (mock は host / srflx / relay を type 別に配布)。

```ts
export interface IceCandidate {
    type: 'host' | 'srflx' | 'prflx' | 'relay';
    /** candidate protocol (udp / tcp、 mock は udp default)。 */
    protocol: 'udp' | 'tcp';
    /** priority (RFC 5245 準拠の値域、 0 〜 2^32-1)。 */
    priority: number;
    /** candidate string の識別子 (RTCIceCandidate.candidate 相当)。 */
    candidate: string;
}
```

#### <code v-pre>SignalingSdp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-signaling.ts#L31) <code v-pre>packages/realtime/src/semantics/webrtc-signaling.ts</code>

signaling 1 セッション分の SDP 情報 (mock 用の簡略化された JSON payload)。

```ts
export interface SignalingSdp {
    type: 'offer' | 'answer';
    /** SDP 本文 (mock は fingerprint hash + 属性列のみ、 完全な SDP 文字列ではない)。 */
    fingerprint: string;
    /** media section 数 (audio / video / data 3 section を default とする)。 */
    mediaSections: number;
    /** BUNDLE / RTCP-mux フラグ (mock では always true)。 */
    bundleEnabled: boolean;
}
```

#### <code v-pre>WebRtcSignalingMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-signaling.ts#L52) <code v-pre>packages/realtime/src/semantics/webrtc-signaling.ts</code>

```ts
export interface WebRtcSignalingMock extends SemanticsMock {
    readonly protocol: 'webrtc';
    readonly axis: 'webrtc-signaling';
    /** 新規セッション開始 → offer 生成 + emit。 */
    createOffer(): Promise<SignalingSdp>;
    /** offer 受信 → answer 生成 + emit。 */
    createAnswer(offer: SignalingSdp): Promise<SignalingSdp>;
    /** ICE candidate を n 件 trickle 送出。 */
    emitIceCandidates(count: number): Promise<IceCandidate[]>;
    /** track 追加時の renegotiation 発火。 */
    renegotiate(): Promise<SignalingSdp>;
}
```
