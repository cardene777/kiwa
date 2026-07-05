/**
 * Video call end-to-end fidelity harness.
 *
 * Sub-Issue #972 (v1.28-2) AC — the mock adapter drives a full 2-user video
 * call ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across four axes.
 *
 *  1. Two peers join the same room, one as offerer + one as answerer, and
 *     both receive an SDP fingerprint back so the signaling round-trip is
 *     observable at the adapter boundary.
 *  2. Each peer publishes a video track. Video tracks default to a 3-layer
 *     simulcast (low / med / high) so the SFU can adapt bitrate per viewer.
 *  3. Each peer publishes an audio track alongside the video. Audio does not
 *     use simulcast.
 *  4. Mute / unmute cycles on the video track are recorded as observable
 *     transitions the harness can diff against a live mediasoup producer.
 *
 * The real adapter is exercised through the env-detect skeleton and every op
 * refuses with `KIWA_WEBRTC_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link VideoCallAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { createRoomHandler, validateRoomRequest } from '../src/app/room/route.js';
import {
  createSignalingHandler,
  validateSignalingRequest,
} from '../src/app/signaling/route.js';
import type { VideoCallAdapter } from '../src/adapters/interface.js';

let mock: VideoCallAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ seed: 7, latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — 2-user video call ceremony', () => {
  it('axis 1: two peers join the same room with distinct SDP fingerprints', async () => {
    const alice = await mock.joinRoom({
      roomId: 'room-1',
      peerId: 'alice',
      role: 'offerer',
      initialMedia: ['audio', 'video'],
    });
    const bob = await mock.joinRoom({
      roomId: 'room-1',
      peerId: 'bob',
      role: 'answerer',
      initialMedia: ['audio', 'video'],
    });
    expect(alice.roomId).toBe('room-1');
    expect(bob.roomId).toBe('room-1');
    expect(alice.role).toBe('offerer');
    expect(bob.role).toBe('answerer');
    // Both peers get an SDP fingerprint back — offerer produces from
    // createOffer, answerer from createAnswer. Neither may be empty and they
    // must not accidentally be identical (deterministic seed still produces
    // per-peer state).
    expect(alice.sdpFingerprint).toMatch(/^sha256:/);
    expect(bob.sdpFingerprint).toMatch(/^sha256:/);
    expect(alice.sdpFingerprint).not.toBe(bob.sdpFingerprint);
  });

  it('axis 2: video publish returns a 3-layer simulcast by default', async () => {
    await mock.joinRoom({ roomId: 'room-2', peerId: 'carol', role: 'offerer' });
    const publish = await mock.publishTrack({
      roomId: 'room-2',
      peerId: 'carol',
      kind: 'video',
    });
    expect(publish.kind).toBe('video');
    expect(publish.simulcastLayers.map((l) => l.rid)).toEqual(['low', 'med', 'high']);
    // Bitrate ladder mirrors the mediasoup default —
    // low 100k / med 300k / high 900k.
    expect(publish.simulcastLayers.map((l) => l.maxBitrate)).toEqual([100_000, 300_000, 900_000]);
  });

  it('axis 3: audio publish carries no simulcast layers', async () => {
    await mock.joinRoom({ roomId: 'room-3', peerId: 'dave', role: 'offerer' });
    const publish = await mock.publishTrack({
      roomId: 'room-3',
      peerId: 'dave',
      kind: 'audio',
    });
    expect(publish.kind).toBe('audio');
    expect(publish.simulcastLayers).toEqual([]);
  });

  it('axis 4: mute + unmute cycle is observable on the trace', async () => {
    await mock.joinRoom({ roomId: 'room-4', peerId: 'erin', role: 'offerer' });
    const publish = await mock.publishTrack({
      roomId: 'room-4',
      peerId: 'erin',
      kind: 'video',
    });
    const muted = await mock.muteTrack({
      roomId: 'room-4',
      peerId: 'erin',
      trackId: publish.trackId,
    });
    expect(muted.muted).toBe(true);
    const unmuted = await mock.unmuteTrack({
      roomId: 'room-4',
      peerId: 'erin',
      trackId: publish.trackId,
    });
    expect(unmuted.muted).toBe(false);
    const trace = mock.traces();
    const ops = trace.map((t) => t.op);
    expect(ops).toContain('muteTrack');
    expect(ops).toContain('unmuteTrack');
  });

  it('adapter — duplicate join for the same peer is rejected with peer_already_joined', async () => {
    await mock.joinRoom({ roomId: 'room-dup', peerId: 'peer-1', role: 'offerer' });
    await expect(
      mock.joinRoom({ roomId: 'room-dup', peerId: 'peer-1', role: 'answerer' }),
    ).rejects.toThrow(/peer peer-1 already/);
    const trace = mock.traces();
    expect(trace.filter((t) => t.errorKind === 'peer_already_joined').length).toBe(1);
  });

  it('adapter — publish without joining rejects with peer_not_in_room', async () => {
    await expect(
      mock.publishTrack({ roomId: 'ghost', peerId: 'ghost-peer', kind: 'video' }),
    ).rejects.toThrow(/is not in ghost/);
    const trace = mock.traces();
    expect(trace.some((t) => t.op === 'publishTrack' && !t.ok)).toBe(true);
  });

  it('adapter — leaveRoom releases published tracks and clears state', async () => {
    await mock.joinRoom({ roomId: 'room-5', peerId: 'frank', role: 'offerer' });
    const publish = await mock.publishTrack({
      roomId: 'room-5',
      peerId: 'frank',
      kind: 'video',
    });
    await mock.leaveRoom({ roomId: 'room-5', peerId: 'frank' });
    // After leaving, mute of the same track must fail — the peer / track is gone.
    await expect(
      mock.muteTrack({ roomId: 'room-5', peerId: 'frank', trackId: publish.trackId }),
    ).rejects.toThrow();
  });

  it('adapter — metrics roll up join + publish + latency samples', async () => {
    await mock.joinRoom({
      roomId: 'room-6',
      peerId: 'gina',
      role: 'offerer',
      initialMedia: ['video'],
    });
    await mock.publishTrack({ roomId: 'room-6', peerId: 'gina', kind: 'audio' });
    const m = mock.metrics();
    expect(m.joinCount).toBe(1);
    expect(m.publishCount).toBe(1);
    expect(m.joinLatencySamplesMs.length).toBe(1);
    expect(m.publishLatencySamplesMs.length).toBe(1);
    expect(m.requests).toBeGreaterThanOrEqual(2);
  });
});

describe('signaling handler — 2-user offer / answer round-trip', () => {
  it('routes an offer through the adapter and returns an SDP fingerprint', async () => {
    const handler = createSignalingHandler({ adapter: mock });
    const res = await handler({
      kind: 'offer',
      role: 'offerer',
      roomId: 'sig-1',
      peerId: 'sig-peer-1',
      initialMedia: ['audio', 'video'],
    });
    expect(res.ok).toBe(true);
    expect(res.kind).toBe('offer');
    expect(res.sdpFingerprint).toMatch(/^sha256:/);
  });

  it('routes an answer through the adapter and returns an SDP fingerprint', async () => {
    const handler = createSignalingHandler({ adapter: mock });
    const res = await handler({
      kind: 'answer',
      role: 'answerer',
      roomId: 'sig-2',
      peerId: 'sig-peer-2',
    });
    expect(res.ok).toBe(true);
    expect(res.kind).toBe('answer');
    expect(res.sdpFingerprint).toMatch(/^sha256:/);
  });

  it('rejects a payload without a roomId', () => {
    const result = validateSignalingRequest({ peerId: 'x', kind: 'offer' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('missing_room_id');
  });

  it('rejects a payload with an unknown kind', () => {
    const result = validateSignalingRequest({
      roomId: 'r',
      peerId: 'p',
      kind: 'delete-room',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('invalid_kind');
  });
});

describe('room handler — publish + mute + leave', () => {
  it('publishes an audio track through the room handler', async () => {
    const signaling = createSignalingHandler({ adapter: mock });
    await signaling({
      kind: 'offer',
      role: 'offerer',
      roomId: 'rh-1',
      peerId: 'rh-peer-1',
    });
    const handler = createRoomHandler({ adapter: mock });
    const res = await handler({
      kind: 'publish',
      roomId: 'rh-1',
      peerId: 'rh-peer-1',
      media: 'audio',
    });
    expect(res.ok).toBe(true);
    expect(res.kind).toBe('publish');
    expect(res.simulcastLayers).toBe(0);
    expect(res.trackId).toBeDefined();
  });

  it('validateRoomRequest rejects a select-layer without a valid layer', () => {
    const result = validateRoomRequest({
      roomId: 'r',
      peerId: 'p',
      kind: 'select-layer',
      trackId: 't',
      layer: 'ultra',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('invalid_layer');
  });

  it('validateRoomRequest rejects a publish without a media kind', () => {
    const result = validateRoomRequest({
      roomId: 'r',
      peerId: 'p',
      kind: 'publish',
      media: 'screenshare',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('invalid_media');
  });
});

describe('real adapter — env-missing skeleton', () => {
  it('reports KIWA_WEBRTC_ENV_MISSING when the mediasoup env-detect fails', () => {
    // The test env does not set WEBRTC_MEDIASOUP_READY, so the detect returns
    // the missing-env sentinel — this is the guaranteed shape on all local
    // CI + dev machines and the fidelity harness relies on it.
    const previous = process.env['WEBRTC_MEDIASOUP_READY'];
    delete process.env['WEBRTC_MEDIASOUP_READY'];
    try {
      expect(detectRealEnvMissing()).toBe('KIWA_WEBRTC_ENV_MISSING');
    } finally {
      if (previous !== undefined) process.env['WEBRTC_MEDIASOUP_READY'] = previous;
    }
  });

  it('joinRoom throws KIWA_WEBRTC_ENV_MISSING and records it on the trace', async () => {
    const real = makeRealAdapter();
    await expect(
      real.joinRoom({ roomId: 'x', peerId: 'y', role: 'offerer' }),
    ).rejects.toThrow(/KIWA_WEBRTC_ENV_MISSING/);
    const trace = real.traces();
    expect(trace.some((t) => t.op === 'joinRoom' && t.errorKind)).toBe(true);
  });

  it('KIWA_MODE=mock is reported as the reason when set', () => {
    const previous = process.env['KIWA_MODE'];
    process.env['KIWA_MODE'] = 'mock';
    try {
      expect(detectRealEnvMissing()).toBe('KIWA_MODE=mock');
    } finally {
      if (previous === undefined) delete process.env['KIWA_MODE'];
      else process.env['KIWA_MODE'] = previous;
    }
  });
});
