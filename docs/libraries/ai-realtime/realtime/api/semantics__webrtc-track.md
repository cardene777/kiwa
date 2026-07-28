---
title: "@kiwa-lab/realtime semantics__webrtc-track の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;webrtc-track</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-track.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createWebRtcTrackMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-track.ts#L69) <code v-pre>packages/realtime/src/semantics/webrtc-track.ts</code>

```ts
export declare function createWebRtcTrackMock(config?: SemanticsMockConfig): WebRtcTrackMock;
```

### 型

#### <code v-pre>MediaTrack</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-track.ts#L34) <code v-pre>packages/realtime/src/semantics/webrtc-track.ts</code>

```ts
export interface MediaTrack {
    readonly id: string;
    readonly kind: TrackKind;
    readonly label: string;
    enabled: boolean;
    /** simulcast layer 定義 (video のみ、 audio は空)。 */
    readonly simulcastLayers: SimulcastLayer[];
}
```

#### <code v-pre>SimulcastLayer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-track.ts#L43) <code v-pre>packages/realtime/src/semantics/webrtc-track.ts</code>

```ts
export interface SimulcastLayer {
    rid: 'low' | 'med' | 'high';
    maxBitrate: number;
    scaleResolutionDownBy: number;
}
```

#### <code v-pre>TrackKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-track.ts#L32) <code v-pre>packages/realtime/src/semantics/webrtc-track.ts</code>

WebRTC track axis — getUserMedia mock + MediaStream + track add/remove + simulcast layer を mock 化する。 実 WebRTC 呼出形式 (`getUserMedia` + `RTCPeerConnection.addTrack`) は以下 ... ```ts const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); for (const track of stream.getTracks()) { const sender = pc.addTrack(track, stream); sender.setParameters({ encodings: [ { rid: 'low', maxBitrate: 100000 }, { rid: 'med', maxBitrate: 300000 }, { rid: 'high', maxBitrate: 900000 }, ]}); } track.enabled = false; // mute ``` 本 mock は上記 4 event (track-add / track-remove / track-mute / track-unmute) と simulcast layer 情報を deterministic に再現する。

```ts
export type TrackKind = 'audio' | 'video';
```

#### <code v-pre>WebRtcTrackMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-track.ts#L54) <code v-pre>packages/realtime/src/semantics/webrtc-track.ts</code>

```ts
export interface WebRtcTrackMock extends SemanticsMock {
    readonly protocol: 'webrtc';
    readonly axis: 'webrtc-track';
    /** getUserMedia 相当 — audio / video track を含む stream を生成。 */
    getUserMedia(constraints?: {
        audio?: boolean;
        video?: boolean;
    }): Promise<MediaStream>;
    /** track 追加 — sender 相当の handle を返す。 */
    addTrack(track: MediaTrack, stream: MediaStream): Promise<{
        trackId: string;
    }>;
    /** track 削除。 */
    removeTrack(trackId: string): Promise<void>;
    /** track mute (enabled=false 相当)。 */
    muteTrack(trackId: string): Promise<void>;
    /** track unmute。 */
    unmuteTrack(trackId: string): Promise<void>;
}
```
