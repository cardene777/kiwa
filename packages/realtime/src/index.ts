export type {
  BroadcastEvent,
  ConnectionState,
  PostgresChangeEvent,
  PostgresChangeType,
  PresenceEvent,
  PresenceEventType,
  PresenceMember,
  RealtimeAnyEvent,
  RealtimeEventHandler,
  RealtimeMetrics,
  RealtimeMock,
  RealtimeMockConfig,
  ReconnectPolicy,
  Room,
  ScenarioEvent,
  SubscriptionHandle,
} from './types.js';

export { RealtimeEngine } from './engine.js';

export {
  createSupabaseRealtimeMock,
  type SupabaseBroadcastFilter,
  type SupabaseBroadcastPayload,
  type SupabaseChannel,
  type SupabaseListenerType,
  type SupabaseMock,
  type SupabasePostgresChangesFilter,
  type SupabasePostgresChangesPayload,
  type SupabasePresenceFilter,
  type SupabasePresencePayload,
} from './supabase.js';

export {
  createAblyMock,
  type AblyChannel,
  type AblyChannels,
  type AblyMessage,
  type AblyMock,
  type AblyPresence,
  type AblyPresenceMessage,
} from './ably.js';

export {
  createPusherMock,
  type PusherChannel,
  type PusherMember,
  type PusherMembers,
  type PusherMock,
} from './pusher.js';

export {
  createSocketioMock,
  type SocketIoMock,
  type SocketIoNamespace,
  type SocketIoSocket,
} from './socketio.js';

export {
  createMockCollector,
  runRealtimeFidelityCheck,
  sequenceSimilarity,
  type CollectedEvent,
  type RealtimeDriver,
  type RealtimeFidelityInput,
  type RealtimeFidelityRecord,
  type RealtimeFidelityReport,
} from './fidelity.js';

export {
  buildRealtimeReport,
  type BuildRealtimeReportInput,
} from './report.js';

/**
 * v0.2 advanced semantics + fidelity grid (GH #971)。
 */
export {
  measureSemanticsAxis,
  measureSemanticsGrid,
  SEMANTICS_GRID,
  type SemanticsFidelityInput,
  type SemanticsFidelityRow,
  type SemanticsGridRow,
  type SemanticsGridScenarios,
} from './semantics-fidelity.js';

/**
 * v0.2 real driver env-gate — v1.13 4 provider の real driver 経路を
 * `KIWA_MODE=real` + 必須 env key set 時のみ有効化する共通 helper (GH #971)。
 */
export {
  REAL_DRIVER_REQUIRED_KEYS,
  resolveRealtimeDriver,
  resolveRealtimeDriverByProvider,
  type RealDriverGateInput,
  type RealDriverGateResult,
  type RealtimeProviderName,
} from './real-driver.js';

/**
 * v0.2 advanced semantics — 3 protocol (WebRTC / WebTransport / HTTP/3-QUIC)
 * × 8 axis (signaling / data-channel / track / ice / uni / bi / push /
 * multiplex) の低レイヤ transport 挙動 mock。 GH #971 で追加。
 */
export {
  createHttp3PushMock,
  createQuicMultiplexMock,
  createWebRtcDataChannelMock,
  createWebRtcIceMock,
  createWebRtcSignalingMock,
  createWebRtcTrackMock,
  createWebTransportBiMock,
  createWebTransportUniMock,
  initialMetrics as initialSemanticsMetrics,
  type BiStreamHandle,
  type BiStreamOptions,
  type DataChannelHandle,
  type DataChannelOptions,
  type HpackEntry,
  type Http3PushMock,
  type IceCandidate,
  type IceConnectionState,
  type IceGatheringState,
  type IceStats,
  type MediaTrack,
  type PushPriority,
  type PushPromise,
  type QuicMultiplexMock,
  type QuicStreamHandle,
  type QuicStreamOptions,
  type SemanticsAxis,
  type SemanticsEvent,
  type SemanticsEventKind,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
  type SemanticsProtocol,
  type SignalingSdp,
  type SimulcastLayer,
  type TrackKind,
  type UniStreamHandle,
  type WebRtcDataChannelMock,
  type WebRtcIceMock,
  type WebRtcMediaStream,
  type WebRtcSignalingMock,
  type WebRtcTrackMock,
  type WebTransportBiMock,
  type WebTransportUniMock,
} from './semantics/index.js';
