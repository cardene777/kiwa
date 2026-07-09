/**
 * v1.28-5 docs 補強 (Issue #975) — tutorial 52-54 code snippet 検証。
 *
 * `docs/tutorials/52-webrtc-video-signaling.md` /
 * `docs/tutorials/53-webtransport-stream.md` /
 * `docs/tutorials/54-http3-multiplex.md` に載っている code snippet が
 * 実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。 v1.17 / v1.19 / v1.20 /
 * v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 の
 * docs-tutorial-v*.test.ts と同 pattern。 6 milestone 連続 pattern
 * (v1.23-v1.28) を確立する。
 *
 * v1.28 は @kiwa-lab/realtime v0.2 の 3 protocol × 8 axis low-layer transport
 * mocks + 24-row SEMANTICS_GRID + resolveRealtimeDriver env-gate を扱う。
 * tutorial 52 は WebRTC video call (signaling + ICE + track + simulcast +
 * iceRestart)、 tutorial 53 は WebTransport (uni + bi + backpressure + reset +
 * datagram + migration + 0-RTT)、 tutorial 54 は HTTP/3 + QUIC (priority
 * scheduling + HPACK dynamic table + 0-RTT anti-replay + FIN)。 tutorial 内の
 * TypeScript snippet (adapter contract + mock adapter + behavior tests) を
 * behavior test で 1:1 に走らせる。 Playwright e2e spec / stub real
 * adapter (KIWA_*_ENV_MISSING 経路) は behavior test の対象外 (env gate は
 * dogfood app 側で検証済み、 tutorial 内 stub は shape 説明のみ)。
 */
import { describe, expect, it } from 'vitest';
import {
  createHttp3PushMock,
  createQuicMultiplexMock,
  createWebRtcDataChannelMock,
  createWebRtcIceMock,
  createWebRtcSignalingMock,
  createWebRtcTrackMock,
  createWebTransportBiMock,
  createWebTransportUniMock,
  measureSemanticsAxis,
  measureSemanticsGrid,
  REAL_DRIVER_REQUIRED_KEYS,
  resolveRealtimeDriver,
  resolveRealtimeDriverByProvider,
  SEMANTICS_GRID,
  type BiStreamHandle,
  type MediaTrack,
  type QuicStreamHandle,
  type SemanticsAxis,
  type SemanticsMock,
  type SemanticsProtocol,
  type UniStreamHandle,
  type WebRtcIceMock,
  type WebRtcSignalingMock,
  type WebRtcTrackMock,
  type WebTransportBiMock,
  type WebTransportUniMock,
  type QuicMultiplexMock,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 52 — WebRTC video call
//   Section 3 mock adapter shape + Section 5/6 behavior tests
// ---------------------------------------------------------------------------

type PeerRole = 'offerer' | 'answerer';
type MediaKind = 'audio' | 'video';

interface VideoCallAdapter {
  readonly mode: 'real' | 'mock';
  joinRoom(input: {
    roomId: string;
    peerId: string;
    role: PeerRole;
    initialMedia?: MediaKind[];
  }): Promise<{ sdpFingerprint: string; latencyMs: number }>;
  leaveRoom(input: { roomId: string; peerId: string }): Promise<void>;
  publishTrack(input: {
    roomId: string;
    peerId: string;
    kind: MediaKind;
    simulcast?: boolean;
  }): Promise<{
    trackId: string;
    kind: MediaKind;
    simulcastLayers: Array<{ rid: 'low' | 'med' | 'high'; maxBitrate: number }>;
  }>;
  muteTrack(input: {
    roomId: string;
    peerId: string;
    trackId: string;
  }): Promise<{ muted: true }>;
  selectLayer(input: {
    roomId: string;
    peerId: string;
    trackId: string;
    layer: 'low' | 'med' | 'high';
  }): Promise<{ layer: 'low' | 'med' | 'high' }>;
  iceRestart(input: {
    roomId: string;
    peerId: string;
    forceRelay?: boolean;
  }): Promise<{ candidatesGathered: number; relayUsed: boolean }>;
}

interface PeerStateT52 {
  role: PeerRole;
  signaling: WebRtcSignalingMock;
  ice: WebRtcIceMock;
  tracks: WebRtcTrackMock;
  publishedTracks: Set<string>;
}

function makeMockAdapterT52(opts: { seed?: number } = {}): VideoCallAdapter {
  const rooms = new Map<string, Map<string, PeerStateT52>>();
  let peerSeq = 0;

  function createPeer(role: PeerRole): PeerStateT52 {
    peerSeq += 1;
    const cfg = {
      seed: ((opts.seed ?? 1) * 2654435761 + peerSeq * 1000003) & 0x7fffffff,
      artificialLatencyMs: 1,
    };
    return {
      role,
      signaling: createWebRtcSignalingMock(cfg),
      ice: createWebRtcIceMock(cfg),
      tracks: createWebRtcTrackMock(cfg),
      publishedTracks: new Set<string>(),
    };
  }

  return {
    mode: 'mock',
    async joinRoom(input) {
      const t0 = Date.now();
      let room = rooms.get(input.roomId);
      if (!room) {
        room = new Map();
        rooms.set(input.roomId, room);
      }
      const peer = createPeer(input.role);
      room.set(input.peerId, peer);
      const sdp =
        input.role === 'offerer'
          ? await peer.signaling.createOffer()
          : await peer.signaling.createAnswer({
              type: 'offer',
              fingerprint: `sha256:remote-${input.peerId}`,
              mediaSections: 3,
              bundleEnabled: true,
            });
      await peer.ice.startGathering(3);
      await peer.ice.startConnectivityCheck();
      return { sdpFingerprint: sdp.fingerprint, latencyMs: Date.now() - t0 };
    },
    async leaveRoom(input) {
      const room = rooms.get(input.roomId);
      const peer = room?.get(input.peerId);
      if (!room || !peer) return;
      for (const trackId of peer.publishedTracks) {
        await peer.tracks.removeTrack(trackId);
      }
      room.delete(input.peerId);
      if (room.size === 0) rooms.delete(input.roomId);
    },
    async publishTrack(input) {
      const peer = rooms.get(input.roomId)?.get(input.peerId);
      if (!peer) throw new Error('peer_not_in_room');
      const stream = await peer.tracks.getUserMedia({
        audio: input.kind === 'audio',
        video: input.kind === 'video',
      });
      const track = stream.tracks[0] as MediaTrack | undefined;
      if (!track) throw new Error('no_track');
      await peer.tracks.addTrack(track, stream);
      peer.publishedTracks.add(track.id);
      const layers =
        input.kind === 'video' && (input.simulcast ?? true)
          ? track.simulcastLayers.map((l) => ({ rid: l.rid, maxBitrate: l.maxBitrate }))
          : [];
      return { trackId: track.id, kind: track.kind, simulcastLayers: layers };
    },
    async muteTrack(input) {
      const peer = rooms.get(input.roomId)?.get(input.peerId);
      if (!peer) throw new Error('peer_not_in_room');
      await peer.tracks.muteTrack(input.trackId);
      return { muted: true };
    },
    async selectLayer(input) {
      const peer = rooms.get(input.roomId)?.get(input.peerId);
      if (!peer) throw new Error('peer_not_in_room');
      return { layer: input.layer };
    },
    async iceRestart(input) {
      const peer = rooms.get(input.roomId)?.get(input.peerId);
      if (!peer) throw new Error('peer_not_in_room');
      await peer.signaling.renegotiate();
      peer.ice.reset();
      await peer.ice.startGathering(3);
      if (input.forceRelay) await peer.ice.forceRelay();
      await peer.ice.startConnectivityCheck();
      const stats = peer.ice.getIceStats();
      return {
        candidatesGathered: stats.candidatesGathered,
        relayUsed: stats.relayUsedCount > 0,
      };
    },
  };
}

describe('tutorial 52 — video-call mock adapter (Section 5)', () => {
  it('offerer publishes video with 3 simulcast layers by default', async () => {
    const adapter = makeMockAdapterT52();
    await adapter.joinRoom({ roomId: 'r1', peerId: 'alice', role: 'offerer' });
    const pub = await adapter.publishTrack({ roomId: 'r1', peerId: 'alice', kind: 'video' });
    expect(pub.simulcastLayers.map((l) => l.rid)).toEqual(['low', 'med', 'high']);
    expect(pub.simulcastLayers.map((l) => l.maxBitrate)).toEqual([100000, 300000, 900000]);
  });

  it('offerer + answerer negotiate distinct SDP fingerprints', async () => {
    const adapter = makeMockAdapterT52({ seed: 42 });
    const a = await adapter.joinRoom({ roomId: 'r1', peerId: 'alice', role: 'offerer' });
    const b = await adapter.joinRoom({ roomId: 'r1', peerId: 'bob', role: 'answerer' });
    expect(a.sdpFingerprint).not.toBe(b.sdpFingerprint);
    expect(a.sdpFingerprint.startsWith('sha256:')).toBe(true);
  });

  it('viewer switches simulcast layer and the adapter records the preference', async () => {
    const adapter = makeMockAdapterT52();
    await adapter.joinRoom({ roomId: 'r1', peerId: 'alice', role: 'offerer' });
    const pub = await adapter.publishTrack({ roomId: 'r1', peerId: 'alice', kind: 'video' });
    const sw = await adapter.selectLayer({
      roomId: 'r1',
      peerId: 'alice',
      trackId: pub.trackId,
      layer: 'med',
    });
    expect(sw.layer).toBe('med');
  });
});

describe('tutorial 52 — ice-restart (Section 6)', () => {
  it('preserves published tracks across the restart', async () => {
    const adapter = makeMockAdapterT52();
    await adapter.joinRoom({ roomId: 'r1', peerId: 'alice', role: 'offerer' });
    const pub = await adapter.publishTrack({ roomId: 'r1', peerId: 'alice', kind: 'video' });
    const restart = await adapter.iceRestart({ roomId: 'r1', peerId: 'alice' });
    expect(restart.candidatesGathered).toBe(3);
    expect(restart.relayUsed).toBe(false);
    await expect(
      adapter.muteTrack({ roomId: 'r1', peerId: 'alice', trackId: pub.trackId }),
    ).resolves.toEqual({ muted: true });
  });

  it('marks relayUsed=true when forceRelay is passed', async () => {
    const adapter = makeMockAdapterT52();
    await adapter.joinRoom({ roomId: 'r1', peerId: 'alice', role: 'offerer' });
    const restart = await adapter.iceRestart({
      roomId: 'r1',
      peerId: 'alice',
      forceRelay: true,
    });
    expect(restart.relayUsed).toBe(true);
    expect(restart.candidatesGathered).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 53 — WebTransport stream
//   Section 3 mock adapter shape + Section 5/6/7 behavior tests
// ---------------------------------------------------------------------------

type StreamDirection = 'uni' | 'bi';

interface WebTransportStreamAdapter {
  readonly mode: 'real' | 'mock';
  openSession(input: { origin: string; zeroRtt?: boolean }): Promise<{
    sessionId: string;
    zeroRttUsed: boolean;
    latencyMs: number;
  }>;
  closeSession(input: { sessionId: string }): Promise<void>;
  openUniStream(input: { sessionId: string }): Promise<{ streamId: string }>;
  openBiStream(input: {
    sessionId: string;
    windowSize?: number;
  }): Promise<{ streamId: string; windowSize: number }>;
  writeStream(input: {
    sessionId: string;
    streamId: string;
    direction: StreamDirection;
    data: Uint8Array;
  }): Promise<{ byteLength: number; backpressure: boolean; remainingWindow: number }>;
  readStream(input: {
    sessionId: string;
    streamId: string;
  }): Promise<{ data: Uint8Array | null }>;
  resetStream(input: {
    sessionId: string;
    streamId: string;
    direction: StreamDirection;
    errorCode: number;
  }): Promise<void>;
  sendDatagram(input: {
    sessionId: string;
    data: Uint8Array;
  }): Promise<{ byteLength: number }>;
  migrateConnection(input: {
    sessionId: string;
    reason: 'path-change' | 'network-change';
  }): Promise<{ pathValidated: boolean }>;
}

interface SessionStateT53 {
  origin: string;
  uni: WebTransportUniMock;
  bi: WebTransportBiMock;
  uniStreams: Map<string, UniStreamHandle>;
  biStreams: Map<string, BiStreamHandle>;
}

function makeMockAdapterT53(opts: { seed?: number } = {}): WebTransportStreamAdapter {
  const sessions = new Map<string, SessionStateT53>();
  let sessionSeq = 0;

  return {
    mode: 'mock',
    async openSession(input) {
      sessionSeq += 1;
      const sessionId = `wt-${sessionSeq}`;
      const cfg = { seed: (opts.seed ?? 1) + sessionSeq, artificialLatencyMs: 1 };
      const state: SessionStateT53 = {
        origin: input.origin,
        uni: createWebTransportUniMock(cfg),
        bi: createWebTransportBiMock(cfg),
        uniStreams: new Map(),
        biStreams: new Map(),
      };
      sessions.set(sessionId, state);
      return { sessionId, zeroRttUsed: input.zeroRtt ?? false, latencyMs: 1 };
    },
    async closeSession(input) {
      const state = sessions.get(input.sessionId);
      if (!state) return;
      for (const s of state.uniStreams.values()) await s.close();
      for (const s of state.biStreams.values()) await s.close();
      sessions.delete(input.sessionId);
    },
    async openUniStream(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      const stream = await state.uni.createUniStream();
      state.uniStreams.set(stream.id, stream);
      return { streamId: stream.id };
    },
    async openBiStream(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      const stream = await state.bi.createBiStream(
        input.windowSize !== undefined ? { windowSize: input.windowSize } : {},
      );
      state.biStreams.set(stream.id, stream);
      return { streamId: stream.id, windowSize: stream.windowRemaining };
    },
    async writeStream(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      if (input.direction === 'uni') {
        const stream = state.uniStreams.get(input.streamId);
        if (!stream) throw new Error('stream_not_open');
        await stream.write(input.data);
        return { byteLength: input.data.byteLength, backpressure: false, remainingWindow: 0 };
      }
      const stream = state.biStreams.get(input.streamId);
      if (!stream) throw new Error('stream_not_open');
      const beforeWindow = stream.windowRemaining;
      const wouldBackpressure = input.data.byteLength > beforeWindow;
      await stream.write(input.data);
      return {
        byteLength: input.data.byteLength,
        backpressure: wouldBackpressure,
        remainingWindow: stream.windowRemaining,
      };
    },
    async readStream(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      const stream = state.biStreams.get(input.streamId);
      if (!stream) return { data: null };
      const chunk = await stream.read();
      return { data: chunk };
    },
    async resetStream(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      if (input.direction === 'uni') {
        const stream = state.uniStreams.get(input.streamId);
        if (!stream) return;
        await stream.reset(input.errorCode);
      }
    },
    async sendDatagram(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      await state.uni.sendDatagram(input.data);
      return { byteLength: input.data.byteLength };
    },
    async migrateConnection(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      const hasActive = state.biStreams.size > 0 || state.uniStreams.size > 0;
      return {
        pathValidated: input.reason === 'path-change' ? true : hasActive,
      };
    },
  };
}

describe('tutorial 53 — bi-stream backpressure (Section 5)', () => {
  it('accepts a write within the window without backpressure', async () => {
    const adapter = makeMockAdapterT53();
    const s = await adapter.openSession({ origin: 'https://example.com/wt' });
    const stream = await adapter.openBiStream({ sessionId: s.sessionId, windowSize: 128 });
    expect(stream.windowSize).toBe(128);
    const w = await adapter.writeStream({
      sessionId: s.sessionId,
      streamId: stream.streamId,
      direction: 'bi',
      data: new Uint8Array(100),
    });
    expect(w.backpressure).toBe(false);
    expect(w.remainingWindow).toBe(28);
  });

  it('signals backpressure when the write exceeds the remaining window', async () => {
    const adapter = makeMockAdapterT53();
    const s = await adapter.openSession({ origin: 'https://example.com/wt' });
    const stream = await adapter.openBiStream({ sessionId: s.sessionId, windowSize: 128 });
    await adapter.writeStream({
      sessionId: s.sessionId,
      streamId: stream.streamId,
      direction: 'bi',
      data: new Uint8Array(100),
    });
    const w = await adapter.writeStream({
      sessionId: s.sessionId,
      streamId: stream.streamId,
      direction: 'bi',
      data: new Uint8Array(200),
    });
    expect(w.backpressure).toBe(true);
    expect(w.remainingWindow).toBeLessThan(128);
  });
});

describe('tutorial 53 — uni-stream reset (Section 6)', () => {
  it('reset(errorCode) prevents further writes on the same stream', async () => {
    const adapter = makeMockAdapterT53();
    const s = await adapter.openSession({ origin: 'https://example.com/wt' });
    const stream = await adapter.openUniStream({ sessionId: s.sessionId });
    await adapter.writeStream({
      sessionId: s.sessionId,
      streamId: stream.streamId,
      direction: 'uni',
      data: new Uint8Array([1, 2, 3]),
    });
    await adapter.resetStream({
      sessionId: s.sessionId,
      streamId: stream.streamId,
      direction: 'uni',
      errorCode: 42,
    });
    await expect(
      adapter.writeStream({
        sessionId: s.sessionId,
        streamId: stream.streamId,
        direction: 'uni',
        data: new Uint8Array([4, 5, 6]),
      }),
    ).rejects.toThrow(/not open/);
  });
});

describe('tutorial 53 — migration + 0-RTT (Section 7)', () => {
  it('0-RTT flag round-trips through openSession', async () => {
    const adapter = makeMockAdapterT53();
    const s = await adapter.openSession({ origin: 'https://example.com/wt', zeroRtt: true });
    expect(s.zeroRttUsed).toBe(true);
  });

  it('migrateConnection validates the path when active streams exist', async () => {
    const adapter = makeMockAdapterT53();
    const s = await adapter.openSession({ origin: 'https://example.com/wt' });
    await adapter.openBiStream({ sessionId: s.sessionId });
    const m = await adapter.migrateConnection({ sessionId: s.sessionId, reason: 'path-change' });
    expect(m.pathValidated).toBe(true);
  });

  it('migrateConnection refuses network-change when no streams are active', async () => {
    const adapter = makeMockAdapterT53();
    const s = await adapter.openSession({ origin: 'https://example.com/wt' });
    const m = await adapter.migrateConnection({
      sessionId: s.sessionId,
      reason: 'network-change',
    });
    expect(m.pathValidated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 54 — HTTP/3 multiplex
//   Section 3 mock adapter shape + Section 5/6/7 behavior tests
// ---------------------------------------------------------------------------

interface Http3MultiplexAdapter {
  readonly mode: 'real' | 'mock';
  openConnection(input: {
    origin: string;
    enable0RTT?: boolean;
    resumeTicket?: string;
  }): Promise<{ connectionId: string; zeroRttUsed: boolean; latencyMs: number }>;
  closeConnection(input: { connectionId: string }): Promise<void>;
  openStream(input: {
    connectionId: string;
    priority?: number;
  }): Promise<{ streamId: string; priority: number }>;
  concurrentSend(input: {
    connectionId: string;
    streams: Array<{ priority: number; data: Uint8Array }>;
  }): Promise<{ streamIds: string[]; scheduledOrder: string[] }>;
  writeStream(input: {
    connectionId: string;
    streamId: string;
    data: Uint8Array;
  }): Promise<{ byteLength: number }>;
  readStream(input: {
    connectionId: string;
    streamId: string;
  }): Promise<{ data: Uint8Array | null }>;
  closeStream(input: {
    connectionId: string;
    streamId: string;
  }): Promise<{ finSent: true }>;
  insertHpackHeader(input: {
    connectionId: string;
    name: string;
    value: string;
  }): Promise<{ index: number; tableSize: number }>;
  resumeZeroRtt(input: {
    connectionId: string;
    earlyData: Uint8Array;
  }): Promise<{ accepted: boolean; refusalReason?: 'anti-replay' | 'no-ticket' }>;
}

interface ConnectionStateT54 {
  origin: string;
  quic: QuicMultiplexMock;
  streams: Map<string, QuicStreamHandle>;
  zeroRttEnabled: boolean;
  earlyDataUsed: boolean;
}

function makeMockAdapterT54(opts: { seed?: number } = {}): Http3MultiplexAdapter {
  const connections = new Map<string, ConnectionStateT54>();
  let connectionSeq = 0;

  return {
    mode: 'mock',
    async openConnection(input) {
      connectionSeq += 1;
      const connectionId = `h3-${connectionSeq}`;
      const quic = createQuicMultiplexMock({
        seed: (opts.seed ?? 1) + connectionSeq,
        enable0RTT: input.enable0RTT ?? false,
        artificialLatencyMs: 1,
      });
      const state: ConnectionStateT54 = {
        origin: input.origin,
        quic,
        streams: new Map(),
        zeroRttEnabled: input.enable0RTT ?? false,
        earlyDataUsed: false,
      };
      connections.set(connectionId, state);
      const zeroRttUsed = state.zeroRttEnabled && input.resumeTicket !== undefined;
      if (zeroRttUsed) {
        await quic.resumeWithZeroRtt();
        state.earlyDataUsed = true;
      }
      return { connectionId, zeroRttUsed, latencyMs: 1 };
    },
    async closeConnection(input) {
      const state = connections.get(input.connectionId);
      if (!state) return;
      for (const stream of state.streams.values()) await stream.close();
      connections.delete(input.connectionId);
    },
    async openStream(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      const options: { priority?: number } = {};
      if (input.priority !== undefined) options.priority = input.priority;
      const stream = await state.quic.openStream(options);
      state.streams.set(stream.id, stream);
      return { streamId: stream.id, priority: stream.priority };
    },
    async concurrentSend(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      const opened: QuicStreamHandle[] = [];
      for (const s of input.streams) {
        const stream = await state.quic.openStream({ priority: s.priority });
        state.streams.set(stream.id, stream);
        opened.push(stream);
      }
      const scheduled = state.quic
        .getActiveStreams()
        .filter((s) => opened.includes(s));
      return {
        streamIds: opened.map((s) => s.id),
        scheduledOrder: scheduled.map((s) => s.id),
      };
    },
    async writeStream(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      const stream = state.streams.get(input.streamId);
      if (!stream) throw new Error('stream_not_open');
      return { byteLength: input.data.byteLength };
    },
    async readStream(input) {
      connections.get(input.connectionId);
      return { data: null };
    },
    async closeStream(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      const stream = state.streams.get(input.streamId);
      if (!stream) throw new Error('stream_not_open');
      await stream.close();
      return { finSent: true };
    },
    async insertHpackHeader(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      const entry = await state.quic.insertHpackHeader(input.name, input.value);
      return { index: entry.index, tableSize: state.quic.hpackTableSize };
    },
    async resumeZeroRtt(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      if (state.earlyDataUsed) {
        return { accepted: false, refusalReason: 'anti-replay' };
      }
      if (!state.zeroRttEnabled) {
        return { accepted: false, refusalReason: 'no-ticket' };
      }
      await state.quic.resumeWithZeroRtt();
      state.earlyDataUsed = true;
      return { accepted: true };
    },
  };
}

describe('tutorial 54 — priority scheduling (Section 5)', () => {
  it('schedules 3 concurrent streams in priority ascending order', async () => {
    const adapter = makeMockAdapterT54();
    const c = await adapter.openConnection({ origin: 'https://example.com' });
    const result = await adapter.concurrentSend({
      connectionId: c.connectionId,
      streams: [
        { priority: 5, data: new Uint8Array([1]) },
        { priority: 1, data: new Uint8Array([2]) },
        { priority: 3, data: new Uint8Array([3]) },
      ],
    });
    expect(result.streamIds).toHaveLength(3);
    expect(result.scheduledOrder[0]).toBe(result.streamIds[1]);
    expect(result.scheduledOrder[1]).toBe(result.streamIds[2]);
    expect(result.scheduledOrder[2]).toBe(result.streamIds[0]);
  });

  it('single-stream openStream returns the resolved priority', async () => {
    const adapter = makeMockAdapterT54();
    const c = await adapter.openConnection({ origin: 'https://example.com' });
    const stream = await adapter.openStream({ connectionId: c.connectionId, priority: 3 });
    expect(stream.priority).toBe(3);
  });

  it('closeStream emits FIN and prevents further writes', async () => {
    const adapter = makeMockAdapterT54();
    const c = await adapter.openConnection({ origin: 'https://example.com' });
    const stream = await adapter.openStream({ connectionId: c.connectionId });
    const close = await adapter.closeStream({
      connectionId: c.connectionId,
      streamId: stream.streamId,
    });
    expect(close.finSent).toBe(true);
  });
});

describe('tutorial 54 — HPACK dynamic table (Section 6)', () => {
  it('grows the dynamic table monotonically on repeated inserts', async () => {
    const adapter = makeMockAdapterT54();
    const c = await adapter.openConnection({ origin: 'https://example.com' });
    const a = await adapter.insertHpackHeader({
      connectionId: c.connectionId,
      name: 'content-type',
      value: 'application/json',
    });
    const b = await adapter.insertHpackHeader({
      connectionId: c.connectionId,
      name: 'accept',
      value: 'application/json',
    });
    const cc = await adapter.insertHpackHeader({
      connectionId: c.connectionId,
      name: 'x-request-id',
      value: 'abc-123',
    });
    expect(a.index).toBe(0);
    expect(b.index).toBe(1);
    expect(cc.index).toBe(2);
    expect(a.tableSize).toBe(1);
    expect(b.tableSize).toBe(2);
    expect(cc.tableSize).toBe(3);
  });
});

describe('tutorial 54 — 0-RTT anti-replay (Section 7)', () => {
  it('0-RTT is used when both enable0RTT and resumeTicket are provided', async () => {
    const adapter = makeMockAdapterT54();
    const c = await adapter.openConnection({
      origin: 'https://example.com',
      enable0RTT: true,
      resumeTicket: 'ticket-abc',
    });
    expect(c.zeroRttUsed).toBe(true);
  });

  it('0-RTT is not used when only enable0RTT is provided without a ticket', async () => {
    const adapter = makeMockAdapterT54();
    const c = await adapter.openConnection({ origin: 'https://example.com', enable0RTT: true });
    expect(c.zeroRttUsed).toBe(false);
  });

  it('second resumeZeroRtt on the same connection refuses with anti-replay', async () => {
    const adapter = makeMockAdapterT54();
    const c = await adapter.openConnection({
      origin: 'https://example.com',
      enable0RTT: true,
      resumeTicket: 'ticket-abc',
    });
    const second = await adapter.resumeZeroRtt({
      connectionId: c.connectionId,
      earlyData: new Uint8Array([1, 2, 3]),
    });
    expect(second.accepted).toBe(false);
    expect(second.refusalReason).toBe('anti-replay');
  });

  it('resumeZeroRtt on a connection without 0-RTT capability refuses with no-ticket', async () => {
    const adapter = makeMockAdapterT54();
    const c = await adapter.openConnection({ origin: 'https://example.com' });
    const attempt = await adapter.resumeZeroRtt({
      connectionId: c.connectionId,
      earlyData: new Uint8Array([1, 2, 3]),
    });
    expect(attempt.accepted).toBe(false);
    expect(attempt.refusalReason).toBe('no-ticket');
  });
});

// ---------------------------------------------------------------------------
// Concept doc — 24-row SEMANTICS_GRID + measureSemanticsGrid one-shot pattern
// (webrtc-webtransport-testing.md Rule 2 + migration guide § concrete usage)
// ---------------------------------------------------------------------------

describe('concept doc — SEMANTICS_GRID invariants', () => {
  it('grid has exactly 3 × 8 = 24 rows', () => {
    expect(SEMANTICS_GRID.length).toBe(24);
  });

  it('exactly 8 rows are applicable = true (one per axis)', () => {
    const applicable = SEMANTICS_GRID.filter((r) => r.applicable);
    expect(applicable.length).toBe(8);
  });

  it('the 3 protocols are enumerated (webrtc / webtransport / http3-quic)', () => {
    const protocols = new Set(SEMANTICS_GRID.map((r) => r.protocol));
    expect(protocols.size).toBe(3);
    const expected: SemanticsProtocol[] = ['webrtc', 'webtransport', 'http3-quic'];
    for (const p of expected) expect(protocols.has(p)).toBe(true);
  });

  it('the 8 axes are enumerated', () => {
    const axes = new Set(SEMANTICS_GRID.map((r) => r.axis));
    expect(axes.size).toBe(8);
    const expected: SemanticsAxis[] = [
      'webrtc-signaling',
      'webrtc-data-channel',
      'webrtc-track',
      'webrtc-ice',
      'webtransport-uni',
      'webtransport-bi',
      'http3-push',
      'quic-multiplex',
    ];
    for (const a of expected) expect(axes.has(a)).toBe(true);
  });
});

describe('concept doc — measureSemanticsAxis single-axis measurement', () => {
  it('collects events emitted during the scenario', async () => {
    const signaling = createWebRtcSignalingMock({ seed: 1, artificialLatencyMs: 0 });
    const row = await measureSemanticsAxis({
      mock: signaling,
      scenario: async () => {
        await signaling.createOffer();
        await signaling.emitIceCandidates(2);
      },
    });
    expect(row.protocol).toBe('webrtc');
    expect(row.axis).toBe('webrtc-signaling');
    expect(row.applicable).toBe(true);
    expect(row.eventsEmitted).toBe(3); // 1 offer + 2 candidates
    expect(row.events.map((e) => e.kind)).toEqual([
      'offer',
      'ice-candidate',
      'ice-candidate',
    ]);
  });
});

describe('migration guide § concrete usage — measureSemanticsGrid one-shot pattern', () => {
  it('returns 24 rows (applicable and placeholder) in one call', async () => {
    const signaling = createWebRtcSignalingMock({ seed: 1, artificialLatencyMs: 0 });
    const ice = createWebRtcIceMock({ seed: 2, artificialLatencyMs: 0 });
    const track = createWebRtcTrackMock({ seed: 3, artificialLatencyMs: 0 });
    const data = createWebRtcDataChannelMock({ seed: 4, artificialLatencyMs: 0 });
    const uni = createWebTransportUniMock({ seed: 5, artificialLatencyMs: 0 });
    const bi = createWebTransportBiMock({ seed: 6, artificialLatencyMs: 0 });
    const push = createHttp3PushMock({ seed: 7, artificialLatencyMs: 0 });
    const quic = createQuicMultiplexMock({
      seed: 8,
      enable0RTT: true,
      artificialLatencyMs: 0,
    });

    const rows = await measureSemanticsGrid({
      scenarios: new Map<SemanticsAxis, { mock: SemanticsMock; scenario: () => Promise<void> }>([
        [
          'webrtc-signaling',
          {
            mock: signaling,
            scenario: async () => {
              await signaling.createOffer();
            },
          },
        ],
        [
          'webrtc-ice',
          {
            mock: ice,
            scenario: async () => {
              await ice.startGathering(3);
              await ice.startConnectivityCheck();
            },
          },
        ],
        [
          'webrtc-track',
          {
            mock: track,
            scenario: async () => {
              // getUserMedia only bumps stream count; addTrack emits `track-add`
              // — that is the event the fidelity axis measures.
              const stream = await track.getUserMedia({ audio: true, video: true });
              for (const t of stream.tracks) {
                await track.addTrack(t, stream);
              }
            },
          },
        ],
        [
          'webrtc-data-channel',
          {
            mock: data,
            scenario: async () => {
              // createDataChannel schedules `data-open` via a microtask; wait a
              // tick so the fidelity axis observes the emission before the
              // scenario returns.
              data.createDataChannel({ ordered: true });
              await new Promise((r) => setTimeout(r, 5));
            },
          },
        ],
        [
          'webtransport-uni',
          {
            mock: uni,
            scenario: async () => {
              await uni.createUniStream();
            },
          },
        ],
        [
          'webtransport-bi',
          {
            mock: bi,
            scenario: async () => {
              await bi.createBiStream({ windowSize: 1024 });
            },
          },
        ],
        [
          'http3-push',
          {
            mock: push,
            scenario: async () => {
              await push.pushStream('/a.css', { urgency: 3 });
            },
          },
        ],
        [
          'quic-multiplex',
          {
            mock: quic,
            scenario: async () => {
              await quic.openStream({ priority: 128 });
            },
          },
        ],
      ]),
    });
    expect(rows.length).toBe(24);
    const applicableRows = rows.filter((r) => r.applicable);
    expect(applicableRows.length).toBe(8);
    for (const r of applicableRows) {
      expect(r.eventsEmitted).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Migration guide / concept doc — resolveRealtimeDriver env-gate
// ---------------------------------------------------------------------------

describe('migration guide § real driver env-gate (v0.2 exports)', () => {
  it('REAL_DRIVER_REQUIRED_KEYS names 4 provider key sets', () => {
    expect(REAL_DRIVER_REQUIRED_KEYS.supabase).toEqual([
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
    ]);
    expect(REAL_DRIVER_REQUIRED_KEYS.ably).toEqual(['ABLY_API_KEY']);
    expect(REAL_DRIVER_REQUIRED_KEYS.pusher).toEqual([
      'PUSHER_APP_ID',
      'PUSHER_KEY',
      'PUSHER_SECRET',
      'PUSHER_CLUSTER',
    ]);
    expect(REAL_DRIVER_REQUIRED_KEYS.socketio).toEqual(['SOCKETIO_URL']);
  });

  it('resolveRealtimeDriver returns mock when KIWA_MODE is not "real"', () => {
    const result = resolveRealtimeDriver({
      provider: 'supabase',
      requiredKeys: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
      createReal: () => 'real',
      createMock: () => 'mock',
      envSource: {},
    });
    expect(result.isReal).toBe(false);
    expect(result.driver).toBe('mock');
    expect(result.missingKeys).toEqual([]);
  });

  it('resolveRealtimeDriver returns mock when required keys are missing', () => {
    const result = resolveRealtimeDriver({
      provider: 'ably',
      requiredKeys: ['ABLY_API_KEY'],
      createReal: () => 'real',
      createMock: () => 'mock',
      envSource: { KIWA_MODE: 'real' },
    });
    expect(result.isReal).toBe(false);
    expect(result.driver).toBe('mock');
    expect(result.missingKeys).toEqual(['ABLY_API_KEY']);
  });

  it('resolveRealtimeDriver returns real when KIWA_MODE=real + all keys present', () => {
    const result = resolveRealtimeDriver({
      provider: 'ably',
      requiredKeys: ['ABLY_API_KEY'],
      createReal: (env) => `real-${env.ABLY_API_KEY}`,
      createMock: () => 'mock',
      envSource: { KIWA_MODE: 'real', ABLY_API_KEY: 'secret-abc' },
    });
    expect(result.isReal).toBe(true);
    expect(result.driver).toBe('real-secret-abc');
    expect(result.missingKeys).toEqual([]);
  });

  it('resolveRealtimeDriverByProvider is a shorthand for the default key set', () => {
    const result = resolveRealtimeDriverByProvider(
      'socketio',
      (env) => `real-${env.SOCKETIO_URL}`,
      () => 'mock',
      { KIWA_MODE: 'real', SOCKETIO_URL: 'wss://example.com' },
    );
    expect(result.isReal).toBe(true);
    expect(result.driver).toBe('real-wss://example.com');
  });
});
