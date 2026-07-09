/**
 * `@kiwa-lab/realtime` v0.2 semantics — 3 protocol × 8 axis advanced
 * realtime semantics の barrel export。
 *
 * v1.13 の 5 semantics (Presence / Broadcast / PostgresChanges / Room /
 * Reconnect) を chat / CDC 向けとするなら、 v0.2 の 8 axis は WebRTC /
 * WebTransport / HTTP/3 / QUIC の低レイヤ transport 挙動を対象とする。
 */

export {
  initialMetrics,
  type SemanticsAxis,
  type SemanticsEvent,
  type SemanticsEventKind,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
  type SemanticsProtocol,
  type SemanticsScenarioRunner,
} from './types.js';

export {
  createWebRtcSignalingMock,
  type IceCandidate,
  type SignalingSdp,
  type WebRtcSignalingMock,
} from './webrtc-signaling.js';

export {
  createWebRtcDataChannelMock,
  type DataChannelHandle,
  type DataChannelOptions,
  type WebRtcDataChannelMock,
} from './webrtc-data-channel.js';

export {
  createWebRtcTrackMock,
  type MediaStream as WebRtcMediaStream,
  type MediaTrack,
  type SimulcastLayer,
  type TrackKind,
  type WebRtcTrackMock,
} from './webrtc-track.js';

export {
  createWebRtcIceMock,
  type IceConnectionState,
  type IceGatheringState,
  type IceStats,
  type WebRtcIceMock,
} from './webrtc-ice.js';

export {
  createWebTransportUniMock,
  type UniStreamHandle,
  type WebTransportUniMock,
} from './webtransport-uni.js';

export {
  createWebTransportBiMock,
  type BiStreamHandle,
  type BiStreamOptions,
  type WebTransportBiMock,
} from './webtransport-bi.js';

export {
  createHttp3PushMock,
  type Http3PushMock,
  type PushPriority,
  type PushPromise,
} from './http3-push.js';

export {
  createQuicMultiplexMock,
  type HpackEntry,
  type QuicMultiplexMock,
  type QuicStreamHandle,
  type QuicStreamOptions,
} from './quic-multiplex.js';

// v0.3 advanced III (v1.45) — MoQ + WebCodecs + AI-media 8 axis.

export {
  createMoqFetchMock,
  type MoqAnnouncement,
  type MoqFetchMock,
  type MoqObject,
} from './moq-fetch.js';

export {
  createMoqDatagramMediaMock,
  type MoqDatagram,
  type MoqDatagramMediaMock,
} from './moq-datagram-media.js';

export {
  createWebCodecsEncoderMock,
  type EncodedFrame,
  type EncoderConfig,
  type WebCodecsEncoderMock,
} from './webcodecs-encoder.js';

export {
  createWebCodecsDecoderMock,
  type DecoderConfig,
  type WebCodecsDecoderMock,
} from './webcodecs-decoder.js';

export {
  createSimulcastSvcMock,
  type SimulcastSvcLayer,
  type SimulcastSvcMock,
} from './simulcast-svc.js';

export {
  createVoiceStreamingMock,
  type VoiceAudioChunk,
  type VoiceSession,
  type VoiceStreamingMock,
} from './voice-streaming.js';

export {
  createWhisperStreamingMock,
  type WhisperStreamingMock,
  type WhisperTranscript,
} from './whisper-streaming.js';

export {
  createRealtimeAiInferenceMock,
  type AiInferenceRequest,
  type AiInferenceResponse,
  type RealtimeAiInferenceMock,
} from './realtime-ai-inference.js';

// v2.1 session-orchestrator = presence + broadcast + subscription + heartbeat + reconnect の 継続合成 layer
export type {
  RealtimeSessionState,
  RealtimeEvent,
  RealtimeSession,
  RealtimeSessionSummary,
} from './session-orchestrator.js';
export {
  startSession,
  dispatchEvent,
  summarizeSession,
} from './session-orchestrator.js';
