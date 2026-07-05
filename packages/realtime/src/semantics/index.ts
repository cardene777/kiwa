/**
 * `@kiwa-test/realtime` v0.2 semantics — 3 protocol × 8 axis advanced
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
