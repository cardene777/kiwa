---
title: "@kiwa-lab/realtime semantics-webrtc-ice の API 契約"
---

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics-webrtc-ice</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-ice.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createWebRtcIceMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-ice.ts#L57) <code v-pre>packages/realtime/src/semantics/webrtc-ice.ts</code>

```ts
export declare function createWebRtcIceMock(config?: SemanticsMockConfig): WebRtcIceMock;
```

### 型

#### <code v-pre>IceConnectionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-ice.ts#L29) <code v-pre>packages/realtime/src/semantics/webrtc-ice.ts</code>

```ts
export type IceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected';
```

#### <code v-pre>IceGatheringState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-ice.ts#L28) <code v-pre>packages/realtime/src/semantics/webrtc-ice.ts</code>

WebRTC ICE axis — candidate gathering + connectivity check + TURN relay + trickle ICE を mock 化する。 実 WebRTC 呼出形式 (`RTCPeerConnection.onicecandidate` + `iceGatheringState` + `iceConnectionState`) は以下 ... ```ts pc.oniceconnectionstatechange = () =&gt; { console.log(pc.iceConnectionState); // 'checking' → 'connected' → 'completed' }; pc.onicecandidate = (ev) =&gt; { if (ev.candidate) sendToRemote(ev.candidate); }; // trickle ICE — candidate は gathering 中に順次送出、 gathering 終了まで待たない ``` 本 mock は上記 4 event (gathering / checking / connected / relay-used) と trickle ICE (candidate を順次 emit)、 TURN relay 経路情報を再現する。

```ts
export type IceGatheringState = 'new' | 'gathering' | 'complete';
```

#### <code v-pre>IceStats</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-ice.ts#L31) <code v-pre>packages/realtime/src/semantics/webrtc-ice.ts</code>

```ts
export interface IceStats {
    candidatesGathered: number;
    candidatesRemote: number;
    activeCandidatePairs: number;
    /** relay 経路経由 (TURN) が使われた回数。 */
    relayUsedCount: number;
    gatheringDurationMs: number;
}
```

#### <code v-pre>WebRtcIceMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-ice.ts#L40) <code v-pre>packages/realtime/src/semantics/webrtc-ice.ts</code>

```ts
export interface WebRtcIceMock extends SemanticsMock {
    readonly protocol: 'webrtc';
    readonly axis: 'webrtc-ice';
    readonly gatheringState: IceGatheringState;
    readonly connectionState: IceConnectionState;
    /** ICE gathering 開始 — n 件の local candidate を trickle 送出。 */
    startGathering(localCount: number): Promise<void>;
    /** remote candidate を追加。 */
    addRemoteCandidate(candidateId: string): Promise<void>;
    /** connectivity check 開始。 */
    startConnectivityCheck(): Promise<void>;
    /** TURN relay 経路を強制 (host / srflx 失敗時の fallback 用)。 */
    forceRelay(): Promise<void>;
    /** 統計取得。 */
    getIceStats(): IceStats;
}
```
