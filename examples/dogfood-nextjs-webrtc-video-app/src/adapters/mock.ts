/**
 * Mock adapter — drives `@kiwa-lab/realtime` v0.2's `createWebRtcSignalingMock`
 * + `createWebRtcIceMock` + `createWebRtcTrackMock` so the same app code
 * exercises a deterministic WebRTC ceremony without touching mediasoup or a
 * real getUserMedia device. Both mock and real adapters satisfy
 * {@link VideoCallAdapter}, so the fidelity harness can diff them
 * side-by-side.
 *
 * State model — one room manager tracks (roomId, peerId) tuples; each peer
 * owns a signaling mock, an ICE mock, and a track mock so per-peer metrics
 * stay isolated. That matches how mediasoup + coturn allocate producer /
 * consumer / transport instances per peer in production.
 */

import {
  createWebRtcIceMock,
  createWebRtcSignalingMock,
  createWebRtcTrackMock,
  type MediaTrack,
  type WebRtcIceMock,
  type WebRtcSignalingMock,
  type WebRtcTrackMock,
} from '@kiwa-lab/realtime';
import type {
  IceRestartResult,
  JoinRoomResult,
  MediaKind,
  PeerRole,
  PublishTrackResult,
  SelectLayerResult,
  ToggleMuteResult,
  TraceEvent,
  VideoCallAdapter,
} from './interface.js';

interface PeerState {
  role: PeerRole;
  signaling: WebRtcSignalingMock;
  ice: WebRtcIceMock;
  tracks: WebRtcTrackMock;
  publishedTracks: Map<string, { kind: MediaKind; track: MediaTrack }>;
  layerPreferences: Map<string, 'low' | 'med' | 'high'>;
  muted: Set<string>;
}

export interface MakeMockAdapterOptions {
  /** deterministic seed used by the mocks; default 1. */
  seed?: number;
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): VideoCallAdapter {
  const trace: TraceEvent[] = [];
  const rooms = new Map<string, Map<string, PeerState>>();
  // Each peer needs a distinct seed so `createOffer` / `createAnswer` produce
  // different SDP fingerprints — mediasoup + coturn produce per-transport
  // ICE ufrag / SDP fingerprints, so the mock must not accidentally return
  // identical values for peers sharing an adapter.
  let peerSeq = 0;
  let joinCount = 0;
  let publishCount = 0;
  let tracksPublished = 0;
  let tracksUnpublished = 0;
  let mutes = 0;
  let unmutes = 0;
  let layerSwitches = 0;
  let iceRestarts = 0;
  const joinLatencySamplesMs: number[] = [];
  const publishLatencySamplesMs: number[] = [];
  const iceRestartLatencySamplesMs: number[] = [];
  let requests = 0;

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function getPeer(roomId: string, peerId: string): PeerState | null {
    const room = rooms.get(roomId);
    if (!room) return null;
    return room.get(peerId) ?? null;
  }

  function createPeer(role: PeerRole): PeerState {
    peerSeq += 1;
    const baseSeed = opts.seed ?? 1;
    // Offset the seed per peer so mediasoup's per-transport unique-fingerprint
    // guarantee is preserved. Prime 2654435761 (Knuth multiplicative hash)
    // scatters small integer peerSeq inputs so peer #1 vs #2 do not accidentally
    // produce nearby SDP hashes.
    const cfg = {
      seed: (baseSeed * 2654435761 + peerSeq * 1000003) & 0x7fffffff,
      artificialLatencyMs: opts.latencyMs ?? 1,
    };
    return {
      role,
      signaling: createWebRtcSignalingMock(cfg),
      ice: createWebRtcIceMock(cfg),
      tracks: createWebRtcTrackMock(cfg),
      publishedTracks: new Map(),
      layerPreferences: new Map(),
      muted: new Set(),
    };
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async joinRoom(input): Promise<JoinRoomResult> {
      requests += 1;
      const t0 = Date.now();
      let room = rooms.get(input.roomId);
      if (!room) {
        room = new Map();
        rooms.set(input.roomId, room);
      }
      if (room.has(input.peerId)) {
        record('joinRoom', false, { errorKind: 'peer_already_joined' });
        throw new Error(`makeMockAdapter.joinRoom: peer ${input.peerId} already in ${input.roomId}`);
      }
      const peer = createPeer(input.role);
      room.set(input.peerId, peer);

      // Signaling ceremony — offerer emits SDP offer, answerer emits SDP answer
      // in reply. mediasoup + Janus SFUs behave identically at the signaling
      // level even though they use different transport shapes.
      const sdp =
        input.role === 'offerer'
          ? await peer.signaling.createOffer()
          : await peer.signaling.createAnswer({
              type: 'offer',
              fingerprint: `sha256:remote-${input.peerId}`,
              mediaSections: 3,
              bundleEnabled: true,
            });

      // Trickle ICE — gather 3 local candidates + run the connectivity check
      // so the peer transitions to `connected` before any track is published.
      await peer.ice.startGathering(3);
      await peer.ice.startConnectivityCheck();

      // Optionally attach initial media (getUserMedia stream + track publish).
      if (input.initialMedia && input.initialMedia.length > 0) {
        const stream = await peer.tracks.getUserMedia({
          audio: input.initialMedia.includes('audio'),
          video: input.initialMedia.includes('video'),
        });
        for (const t of stream.tracks) {
          await peer.tracks.addTrack(t, stream);
          peer.publishedTracks.set(t.id, { kind: t.kind, track: t });
          tracksPublished += 1;
        }
      }

      const latencyMs = Date.now() - t0;
      joinLatencySamplesMs.push(latencyMs);
      joinCount += 1;
      record('joinRoom', true, {
        detail: {
          roomId: input.roomId,
          peerId: input.peerId,
          role: input.role,
          sdpFingerprint: sdp.fingerprint,
        },
      });
      return {
        roomId: input.roomId,
        peerId: input.peerId,
        role: input.role,
        sdpFingerprint: sdp.fingerprint,
        latencyMs,
      };
    },

    async leaveRoom(input) {
      requests += 1;
      const room = rooms.get(input.roomId);
      if (!room) {
        record('leaveRoom', false, { errorKind: 'room_not_found' });
        return;
      }
      const peer = room.get(input.peerId);
      if (!peer) {
        record('leaveRoom', false, { errorKind: 'peer_not_in_room' });
        return;
      }
      // Release all published tracks so the mediasoup producer close event
      // count matches. Consumers on other peers still receive `track-remove`
      // signals through their own adapter — this is single-peer scoped.
      for (const [trackId] of peer.publishedTracks) {
        await peer.tracks.removeTrack(trackId);
        tracksUnpublished += 1;
      }
      peer.publishedTracks.clear();
      peer.layerPreferences.clear();
      peer.muted.clear();
      room.delete(input.peerId);
      if (room.size === 0) rooms.delete(input.roomId);
      record('leaveRoom', true, { detail: { roomId: input.roomId, peerId: input.peerId } });
    },

    async publishTrack(input): Promise<PublishTrackResult> {
      requests += 1;
      const t0 = Date.now();
      const peer = getPeer(input.roomId, input.peerId);
      if (!peer) {
        record('publishTrack', false, { errorKind: 'peer_not_in_room' });
        throw new Error(
          `makeMockAdapter.publishTrack: peer ${input.peerId} is not in ${input.roomId}`,
        );
      }
      const stream = await peer.tracks.getUserMedia({
        audio: input.kind === 'audio',
        video: input.kind === 'video',
      });
      const track = stream.tracks[0];
      if (!track) {
        record('publishTrack', false, { errorKind: 'no_track_produced' });
        throw new Error('makeMockAdapter.publishTrack: getUserMedia returned no tracks');
      }
      await peer.tracks.addTrack(track, stream);
      peer.publishedTracks.set(track.id, { kind: track.kind, track });
      tracksPublished += 1;
      publishCount += 1;
      const layers =
        input.kind === 'video' && (input.simulcast ?? true)
          ? track.simulcastLayers.map((l) => ({ rid: l.rid, maxBitrate: l.maxBitrate }))
          : [];
      const latencyMs = Date.now() - t0;
      publishLatencySamplesMs.push(latencyMs);
      record('publishTrack', true, {
        detail: {
          roomId: input.roomId,
          peerId: input.peerId,
          trackId: track.id,
          kind: track.kind,
          simulcastLayers: layers.length,
        },
      });
      return {
        roomId: input.roomId,
        peerId: input.peerId,
        trackId: track.id,
        kind: track.kind,
        simulcastLayers: layers,
        latencyMs,
      };
    },

    async unpublishTrack(input) {
      requests += 1;
      const peer = getPeer(input.roomId, input.peerId);
      if (!peer) {
        record('unpublishTrack', false, { errorKind: 'peer_not_in_room' });
        return;
      }
      if (!peer.publishedTracks.has(input.trackId)) {
        record('unpublishTrack', false, { errorKind: 'track_not_published' });
        return;
      }
      await peer.tracks.removeTrack(input.trackId);
      peer.publishedTracks.delete(input.trackId);
      peer.layerPreferences.delete(input.trackId);
      peer.muted.delete(input.trackId);
      tracksUnpublished += 1;
      record('unpublishTrack', true, {
        detail: { roomId: input.roomId, peerId: input.peerId, trackId: input.trackId },
      });
    },

    async muteTrack(input): Promise<ToggleMuteResult> {
      requests += 1;
      const t0 = Date.now();
      const peer = getPeer(input.roomId, input.peerId);
      if (!peer) {
        record('muteTrack', false, { errorKind: 'peer_not_in_room' });
        throw new Error(`makeMockAdapter.muteTrack: peer ${input.peerId} is not in ${input.roomId}`);
      }
      if (!peer.publishedTracks.has(input.trackId)) {
        record('muteTrack', false, { errorKind: 'track_not_published' });
        throw new Error(
          `makeMockAdapter.muteTrack: track ${input.trackId} is not published by ${input.peerId}`,
        );
      }
      await peer.tracks.muteTrack(input.trackId);
      peer.muted.add(input.trackId);
      mutes += 1;
      const latencyMs = Date.now() - t0;
      record('muteTrack', true, {
        detail: { roomId: input.roomId, peerId: input.peerId, trackId: input.trackId, muted: true },
      });
      return {
        roomId: input.roomId,
        peerId: input.peerId,
        trackId: input.trackId,
        muted: true,
        latencyMs,
      };
    },

    async unmuteTrack(input): Promise<ToggleMuteResult> {
      requests += 1;
      const t0 = Date.now();
      const peer = getPeer(input.roomId, input.peerId);
      if (!peer) {
        record('unmuteTrack', false, { errorKind: 'peer_not_in_room' });
        throw new Error(
          `makeMockAdapter.unmuteTrack: peer ${input.peerId} is not in ${input.roomId}`,
        );
      }
      if (!peer.publishedTracks.has(input.trackId)) {
        record('unmuteTrack', false, { errorKind: 'track_not_published' });
        throw new Error(
          `makeMockAdapter.unmuteTrack: track ${input.trackId} is not published by ${input.peerId}`,
        );
      }
      await peer.tracks.unmuteTrack(input.trackId);
      peer.muted.delete(input.trackId);
      unmutes += 1;
      const latencyMs = Date.now() - t0;
      record('unmuteTrack', true, {
        detail: { roomId: input.roomId, peerId: input.peerId, trackId: input.trackId, muted: false },
      });
      return {
        roomId: input.roomId,
        peerId: input.peerId,
        trackId: input.trackId,
        muted: false,
        latencyMs,
      };
    },

    async selectLayer(input): Promise<SelectLayerResult> {
      requests += 1;
      const t0 = Date.now();
      const peer = getPeer(input.roomId, input.peerId);
      if (!peer) {
        record('selectLayer', false, { errorKind: 'peer_not_in_room' });
        throw new Error(
          `makeMockAdapter.selectLayer: peer ${input.peerId} is not in ${input.roomId}`,
        );
      }
      // The consumer picks a preferred layer per remote track — mediasoup
      // stores this on the consumer, kiwa mock stores it on the local peer.
      peer.layerPreferences.set(input.trackId, input.layer);
      layerSwitches += 1;
      const latencyMs = Date.now() - t0;
      record('selectLayer', true, {
        detail: {
          roomId: input.roomId,
          peerId: input.peerId,
          trackId: input.trackId,
          layer: input.layer,
        },
      });
      return {
        roomId: input.roomId,
        peerId: input.peerId,
        trackId: input.trackId,
        layer: input.layer,
        latencyMs,
      };
    },

    async iceRestart(input): Promise<IceRestartResult> {
      requests += 1;
      const t0 = Date.now();
      const peer = getPeer(input.roomId, input.peerId);
      if (!peer) {
        record('iceRestart', false, { errorKind: 'peer_not_in_room' });
        throw new Error(
          `makeMockAdapter.iceRestart: peer ${input.peerId} is not in ${input.roomId}`,
        );
      }
      // Renegotiate + gather a fresh candidate batch. mediasoup exposes
      // Transport.restartIce with the same lifecycle — the mock preserves the
      // publishedTracks map so the track resume path can be measured.
      await peer.signaling.renegotiate();
      peer.ice.reset();
      await peer.ice.startGathering(3);
      if (input.forceRelay) await peer.ice.forceRelay();
      await peer.ice.startConnectivityCheck();
      iceRestarts += 1;
      const latencyMs = Date.now() - t0;
      iceRestartLatencySamplesMs.push(latencyMs);
      const stats = peer.ice.getIceStats();
      record('iceRestart', true, {
        detail: {
          roomId: input.roomId,
          peerId: input.peerId,
          candidatesGathered: stats.candidatesGathered,
          relayUsed: stats.relayUsedCount > 0,
        },
      });
      return {
        roomId: input.roomId,
        peerId: input.peerId,
        candidatesGathered: stats.candidatesGathered,
        relayUsed: stats.relayUsedCount > 0,
        latencyMs,
      };
    },

    metrics() {
      return {
        joinCount,
        publishCount,
        tracksPublished,
        tracksUnpublished,
        mutes,
        unmutes,
        layerSwitches,
        iceRestarts,
        joinLatencySamplesMs: [...joinLatencySamplesMs],
        publishLatencySamplesMs: [...publishLatencySamplesMs],
        iceRestartLatencySamplesMs: [...iceRestartLatencySamplesMs],
        requests,
      };
    },

    async reset(): Promise<void> {
      rooms.clear();
      peerSeq = 0;
      joinCount = 0;
      publishCount = 0;
      tracksPublished = 0;
      tracksUnpublished = 0;
      mutes = 0;
      unmutes = 0;
      layerSwitches = 0;
      iceRestarts = 0;
      joinLatencySamplesMs.length = 0;
      publishLatencySamplesMs.length = 0;
      iceRestartLatencySamplesMs.length = 0;
      requests = 0;
      trace.length = 0;
      record('reset', true);
    },
  };
}
