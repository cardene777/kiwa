---
title: "@kiwa-lab/realtime semantics-types の API 契約"
---

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics-types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>SemanticsAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L25) <code v-pre>packages/realtime/src/semantics/types.ts</code>

axis tag — 8 base axis + 8 advanced III axis の identifier。

```ts
export type SemanticsAxis = 'webrtc-signaling' | 'webrtc-data-channel' | 'webrtc-track' | 'webrtc-ice' | 'webtransport-uni' | 'webtransport-bi' | 'http3-push' | 'quic-multiplex' | 'moq-fetch' | 'moq-datagram-media' | 'webcodecs-encoder' | 'webcodecs-decoder' | 'simulcast-svc' | 'voice-streaming' | 'whisper-streaming' | 'realtime-ai-inference';
```

#### <code v-pre>SemanticsEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L128) <code v-pre>packages/realtime/src/semantics/types.ts</code>

共通 event shape — payload は event kind 別に stringly typed。

```ts
export interface SemanticsEvent<TPayload = unknown> {
    kind: SemanticsEventKind;
    /** stream id / channel id / peer id 等 (axis 固有)。 */
    streamId?: string;
    payload?: TPayload;
    /** collect 開始からの相対 ms。 */
    relativeTimeMs: number;
    /** 順番 (0 origin)。 */
    order: number;
}
```

#### <code v-pre>SemanticsEventKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L45) <code v-pre>packages/realtime/src/semantics/types.ts</code>

共通 transport event kind (8 axis 横断)。

```ts
export type SemanticsEventKind = 'offer' | 'answer' | 'ice-candidate' | 'renegotiation' | 'data-open' | 'data-message' | 'data-close' | 'track-add' | 'track-remove' | 'track-mute' | 'track-unmute' | 'ice-gathering' | 'ice-checking' | 'ice-connected' | 'ice-relay-used' | 'uni-stream-open' | 'uni-stream-write' | 'uni-stream-reset' | 'datagram-recv' | 'bi-stream-open' | 'bi-stream-write' | 'bi-stream-close' | 'bi-backpressure' | 'push-promise' | 'push-headers' | 'push-body' | 'push-cancelled' | 'stream-open' | 'stream-close' | 'hpack-insert' | 'zero-rtt-used' | 'moq-track-announce' | 'moq-track-subscribe' | 'moq-object-sent' | 'moq-object-received' | 'moq-datagram-sent' | 'moq-datagram-dropped' | 'moq-priority-set' | 'moq-fec-recovered' | 'encoder-config-set' | 'encoder-frame-encoded' | 'encoder-keyframe-forced' | 'encoder-hardware-used' | 'decoder-config-set' | 'decoder-frame-decoded' | 'decoder-frame-reordered' | 'decoder-frame-dropped' | 'simulcast-layer-added' | 'svc-layer-selected' | 'bitrate-adapted' | 'layer-dropped' | 'voice-session-open' | 'voice-audio-chunk-sent' | 'voice-response-chunk-received' | 'voice-turn-completed' | 'whisper-audio-chunk-sent' | 'whisper-partial-transcript' | 'whisper-final-transcript' | 'whisper-vad-triggered' | 'ai-inference-request' | 'ai-inference-response' | 'ai-inference-latency-budget' | 'ai-inference-dropped';
```

#### <code v-pre>SemanticsMetrics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L152) <code v-pre>packages/realtime/src/semantics/types.ts</code>

8 axis 共通の累積 metric。 axis 固有 metric は `custom` に格納。

```ts
export interface SemanticsMetrics {
    /** emit された event 総数。 */
    eventsEmitted: number;
    /** open された stream 数 (axis 固有、 signaling 系は 0 のまま)。 */
    streamsOpened: number;
    /** close された stream 数。 */
    streamsClosed: number;
    /** reset された stream 数 (WebTransport / QUIC 固有)。 */
    streamsReset: number;
    /** backpressure イベント発火数 (bi stream 固有)。 */
    backpressureCount: number;
    /** axis 固有の任意 metric。 */
    custom: Record<string, number>;
}
```

#### <code v-pre>SemanticsMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L140) <code v-pre>packages/realtime/src/semantics/types.ts</code>

各 axis mock が満たす最小 interface。

```ts
export interface SemanticsMock {
    readonly protocol: SemanticsProtocol;
    readonly axis: SemanticsAxis;
    /** subscribe 相当 — event stream の handler を登録。 */
    onEvent(handler: (event: SemanticsEvent) => void): () => void;
    /** 累積 metric。 */
    getMetrics(): SemanticsMetrics;
    /** state + metric を初期化。 */
    reset(): void;
}
```

#### <code v-pre>SemanticsMockConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L168) <code v-pre>packages/realtime/src/semantics/types.ts</code>

共通 mock config — artificial latency / seed 等。

```ts
export interface SemanticsMockConfig {
    /** event 間の default delay (ms、 default 1)。 */
    artificialLatencyMs?: number;
    /** deterministic random seed (default 1)。 */
    seed?: number;
}
```

#### <code v-pre>SemanticsProtocol</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L15) <code v-pre>packages/realtime/src/semantics/types.ts</code>

protocol tag — fidelity harness で grid 分類に使う。

```ts
export type SemanticsProtocol = 'webrtc' | 'webtransport' | 'http3-quic' | 'moqt' | 'webcodecs' | 'ai-media';
```
