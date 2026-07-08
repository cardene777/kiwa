/**
 * Provider-neutral WebRTC video call surface for the dogfood app.
 *
 * The Next.js app talks to WebRTC only through this interface. Two
 * implementations exist —
 *  - {@link makeRealAdapter} (drives mediasoup + coturn testcontainers when
 *    `KIWA_MODE=real` + `WEBRTC_MEDIASOUP_READY=1` are set; otherwise every
 *    op reports `KIWA_WEBRTC_ENV_MISSING`)
 *  - {@link makeMockAdapter} (backed by `@kiwa/realtime` v0.2's
 *    `createWebRtcSignalingMock` + `createWebRtcIceMock` +
 *    `createWebRtcTrackMock`)
 *
 * Both must satisfy the same 8-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 4 WebRTC axes
 * (signaling / ice / track / simulcast) that mediasoup + coturn make
 * observable in production.
 *
 * The AC anchors this contract on 3 e2e specs the harness runs against both
 * adapters — video-call-e2e (2-user join + broadcast + mute/unmute),
 * simulcast-e2e (layer + bandwidth adaptation), reconnect-e2e (ICE restart +
 * track resume). Each spec exercises a distinct subset of the ops below so
 * the fidelity report can point at the ops that diverged.
 */

/** WebRTC peer role — offerer starts the SDP exchange, answerer replies. */
export type PeerRole = 'offerer' | 'answerer';

/** Media kind requested by a peer joining a room. */
export type MediaKind = 'audio' | 'video';

/** Result of a peer joining a video call room. */
export interface JoinRoomResult {
  roomId: string;
  peerId: string;
  role: PeerRole;
  /** SDP fingerprint of the offer / answer produced during join. */
  sdpFingerprint: string;
  latencyMs: number;
}

/** Result of publishing a track (audio or video) to the SFU / peer. */
export interface PublishTrackResult {
  roomId: string;
  peerId: string;
  trackId: string;
  kind: MediaKind;
  /** simulcast layer rids the publisher offered (video only, empty for audio). */
  simulcastLayers: Array<{ rid: 'low' | 'med' | 'high'; maxBitrate: number }>;
  latencyMs: number;
}

/** Result of toggling track mute state. */
export interface ToggleMuteResult {
  roomId: string;
  peerId: string;
  trackId: string;
  muted: boolean;
  latencyMs: number;
}

/** Result of a simulcast layer preference change (viewer -> SFU). */
export interface SelectLayerResult {
  roomId: string;
  peerId: string;
  trackId: string;
  layer: 'low' | 'med' | 'high';
  latencyMs: number;
}

/** Result of an ICE restart triggered after network hiccup. */
export interface IceRestartResult {
  roomId: string;
  peerId: string;
  candidatesGathered: number;
  relayUsed: boolean;
  latencyMs: number;
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across mock vs real to detect
 * behavioural divergences.
 */
export interface TraceEvent {
  op:
    | 'joinRoom'
    | 'leaveRoom'
    | 'publishTrack'
    | 'unpublishTrack'
    | 'muteTrack'
    | 'unmuteTrack'
    | 'selectLayer'
    | 'iceRestart'
    | 'reset';
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Video call adapter — the dogfood app performs 8 ops:
 *
 * - `joinRoom` — establish a peer connection with the SFU / remote peer
 *   through signaling (SDP offer / answer + ICE candidate exchange)
 * - `leaveRoom` — close the peer connection and release resources
 * - `publishTrack` — push a local audio / video track onto the connection
 *   (video tracks negotiate 3 simulcast layers by default)
 * - `unpublishTrack` — remove a previously published track
 * - `muteTrack` / `unmuteTrack` — toggle a track's enabled state
 * - `selectLayer` — pick a simulcast layer preference (viewer bandwidth
 *   adaptation, mediasoup consumer.setPreferredLayers equivalent)
 * - `iceRestart` — force a fresh ICE gathering + connectivity check to
 *   recover from network changes without renegotiating tracks
 *
 * `metrics()` exposes rolling aggregates the fidelity harness uses to
 * populate the release-gate rows (perf.p95Ms + fidelity.ratio in
 * particular).
 */
export interface VideoCallAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  joinRoom(input: {
    roomId: string;
    peerId: string;
    role: PeerRole;
    initialMedia?: MediaKind[];
  }): Promise<JoinRoomResult>;

  leaveRoom(input: { roomId: string; peerId: string }): Promise<void>;

  publishTrack(input: {
    roomId: string;
    peerId: string;
    kind: MediaKind;
    /** Optional override — omit to use the default 3-layer simulcast for video. */
    simulcast?: boolean;
  }): Promise<PublishTrackResult>;

  unpublishTrack(input: {
    roomId: string;
    peerId: string;
    trackId: string;
  }): Promise<void>;

  muteTrack(input: {
    roomId: string;
    peerId: string;
    trackId: string;
  }): Promise<ToggleMuteResult>;

  unmuteTrack(input: {
    roomId: string;
    peerId: string;
    trackId: string;
  }): Promise<ToggleMuteResult>;

  selectLayer(input: {
    roomId: string;
    peerId: string;
    trackId: string;
    layer: 'low' | 'med' | 'high';
  }): Promise<SelectLayerResult>;

  iceRestart(input: {
    roomId: string;
    peerId: string;
    /** When true, force relay (TURN) — used by reconnect-e2e to prove TURN fallback. */
    forceRelay?: boolean;
  }): Promise<IceRestartResult>;

  /** Rolling metric aggregate for the fidelity harness. */
  metrics(): {
    joinCount: number;
    publishCount: number;
    tracksPublished: number;
    tracksUnpublished: number;
    mutes: number;
    unmutes: number;
    layerSwitches: number;
    iceRestarts: number;
    joinLatencySamplesMs: number[];
    publishLatencySamplesMs: number[];
    iceRestartLatencySamplesMs: number[];
    requests: number;
  };

  reset(): Promise<void>;
}

/** Adapter list op — used by the room manager to enumerate active peers. */
export interface RoomSnapshot {
  roomId: string;
  peers: Array<{
    peerId: string;
    role: PeerRole;
    trackIds: string[];
  }>;
}
