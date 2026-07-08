/**
 * Shared types for advanced realtime semantics (v0.2、 GH #971)。
 *
 * v1.13 の 5 semantics (Presence / Broadcast / PostgresChanges / Room /
 * Reconnect) が chat / CDC 向けだったのに対し、 v0.2 で 3 protocol 8 axis
 * (WebRTC 4 / WebTransport 2 / HTTP/3 1 / QUIC 1) の低レイヤ transport 挙動
 * を mock として提供する。
 *
 * 各 axis は「共通の transport event 列 + axis 固有 metric」 という shape に
 * 統一されているため、 fidelity harness (24 row grid) からは protocol / axis
 * を pair 指定するだけで実行できる。
 */

/** protocol tag — fidelity harness で grid 分類に使う。 */
export type SemanticsProtocol =
  | 'webrtc'
  | 'webtransport'
  | 'http3-quic'
  // v0.3 advanced III (v1.45)
  | 'moqt'
  | 'webcodecs'
  | 'ai-media';

/** axis tag — 8 base axis + 8 advanced III axis の identifier。 */
export type SemanticsAxis =
  | 'webrtc-signaling'
  | 'webrtc-data-channel'
  | 'webrtc-track'
  | 'webrtc-ice'
  | 'webtransport-uni'
  | 'webtransport-bi'
  | 'http3-push'
  | 'quic-multiplex'
  // v0.3 advanced III (v1.45)
  | 'moq-fetch'
  | 'moq-datagram-media'
  | 'webcodecs-encoder'
  | 'webcodecs-decoder'
  | 'simulcast-svc'
  | 'voice-streaming'
  | 'whisper-streaming'
  | 'realtime-ai-inference';

/** 共通 transport event kind (8 axis 横断)。 */
export type SemanticsEventKind =
  // WebRTC signaling
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'renegotiation'
  // WebRTC data channel
  | 'data-open'
  | 'data-message'
  | 'data-close'
  // WebRTC track
  | 'track-add'
  | 'track-remove'
  | 'track-mute'
  | 'track-unmute'
  // ICE
  | 'ice-gathering'
  | 'ice-checking'
  | 'ice-connected'
  | 'ice-relay-used'
  // WebTransport uni
  | 'uni-stream-open'
  | 'uni-stream-write'
  | 'uni-stream-reset'
  | 'datagram-recv'
  // WebTransport bi
  | 'bi-stream-open'
  | 'bi-stream-write'
  | 'bi-stream-close'
  | 'bi-backpressure'
  // HTTP/3 push
  | 'push-promise'
  | 'push-headers'
  | 'push-body'
  | 'push-cancelled'
  // QUIC multiplex
  | 'stream-open'
  | 'stream-close'
  | 'hpack-insert'
  | 'zero-rtt-used'
  // v0.3 advanced III (v1.45)
  // MoQ fetch (Media over QUIC / MOQT delivery + subscribe + publish)
  | 'moq-track-announce'
  | 'moq-track-subscribe'
  | 'moq-object-sent'
  | 'moq-object-received'
  // MoQ datagram media (partial reliability + priority)
  | 'moq-datagram-sent'
  | 'moq-datagram-dropped'
  | 'moq-priority-set'
  | 'moq-fec-recovered'
  // WebCodecs encoder (VideoEncoder / AudioEncoder direct API)
  | 'encoder-config-set'
  | 'encoder-frame-encoded'
  | 'encoder-keyframe-forced'
  | 'encoder-hardware-used'
  // WebCodecs decoder (VideoDecoder / AudioDecoder + reorder buffer)
  | 'decoder-config-set'
  | 'decoder-frame-decoded'
  | 'decoder-frame-reordered'
  | 'decoder-frame-dropped'
  // Simulcast + SVC layer selection
  | 'simulcast-layer-added'
  | 'svc-layer-selected'
  | 'bitrate-adapted'
  | 'layer-dropped'
  // LLM voice streaming (OpenAI Realtime API + Anthropic voice)
  | 'voice-session-open'
  | 'voice-audio-chunk-sent'
  | 'voice-response-chunk-received'
  | 'voice-turn-completed'
  // Whisper streaming ASR (partial transcript + VAD)
  | 'whisper-audio-chunk-sent'
  | 'whisper-partial-transcript'
  | 'whisper-final-transcript'
  | 'whisper-vad-triggered'
  // Realtime AI inference (per-frame prediction + latency budget)
  | 'ai-inference-request'
  | 'ai-inference-response'
  | 'ai-inference-latency-budget'
  | 'ai-inference-dropped';

/** 共通 event shape — payload は event kind 別に stringly typed。 */
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

/** 各 axis mock が満たす最小 interface。 */
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

/** 8 axis 共通の累積 metric。 axis 固有 metric は `custom` に格納。 */
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

/** 共通 mock config — artificial latency / seed 等。 */
export interface SemanticsMockConfig {
  /** event 間の default delay (ms、 default 1)。 */
  artificialLatencyMs?: number;
  /** deterministic random seed (default 1)。 */
  seed?: number;
}

/**
 * axis mock から fidelity harness に流す用の driver 変換 helper。
 * runtime で `SemanticsMock` を CollectedEvent stream に変換して既存
 * `runRealtimeFidelityCheck` に流し込む場合に使う。
 */
export interface SemanticsScenarioRunner {
  /** scenario を先頭から順に発火。 */
  run(): Promise<SemanticsEvent[]>;
}

/** helper — default metrics。 */
export function initialMetrics(): SemanticsMetrics {
  return {
    eventsEmitted: 0,
    streamsOpened: 0,
    streamsClosed: 0,
    streamsReset: 0,
    backpressureCount: 0,
    custom: {},
  };
}
