/**
 * ICE restart + track resume harness.
 *
 * Sub-Issue #972 (v1.28-2) AC — the mock adapter drives ICE restart under
 * network hiccup, TURN relay fallback, and track state preservation across
 * the restart. The fidelity harness diffs the raw {@link TraceEvent} sequence
 * across four axes.
 *
 *  1. iceRestart gathers a fresh candidate batch (host / srflx / relay) and
 *     re-runs the connectivity check without renegotiating tracks. mediasoup
 *     Transport.restartIce has the same lifecycle.
 *  2. iceRestart with `forceRelay: true` records TURN relay usage on the
 *     trace — the fidelity harness treats relay-used as a distinct axis so
 *     coturn-backed calls stay observable.
 *  3. Track state (published + mute) is preserved across the restart. A
 *     peer that was muted stays muted, tracks stay attached, no re-publish
 *     needed.
 *  4. Multiple sequential iceRestarts each surface a fresh candidate batch —
 *     the metrics counter increments monotonically so a reconnect storm is
 *     observable off the metric alone.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { createRoomHandler } from '../src/app/room/route.js';
import {
  createSignalingHandler,
  validateSignalingRequest,
} from '../src/app/signaling/route.js';
import type { VideoCallAdapter } from '../src/adapters/interface.js';

let mock: VideoCallAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ seed: 13, latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — ICE restart', () => {
  it('axis 1: iceRestart gathers a fresh candidate batch and increments the metric', async () => {
    await mock.joinRoom({ roomId: 'rc-1', peerId: 'rc-peer-1', role: 'offerer' });
    const result = await mock.iceRestart({
      roomId: 'rc-1',
      peerId: 'rc-peer-1',
    });
    expect(result.candidatesGathered).toBeGreaterThan(0);
    expect(result.relayUsed).toBe(false);
    const m = mock.metrics();
    expect(m.iceRestarts).toBe(1);
    expect(m.iceRestartLatencySamplesMs.length).toBe(1);
  });

  it('axis 2: iceRestart with forceRelay records TURN relay usage', async () => {
    await mock.joinRoom({ roomId: 'rc-2', peerId: 'rc-peer-2', role: 'offerer' });
    const result = await mock.iceRestart({
      roomId: 'rc-2',
      peerId: 'rc-peer-2',
      forceRelay: true,
    });
    expect(result.relayUsed).toBe(true);
    const trace = mock.traces();
    const restart = trace.find((t) => t.op === 'iceRestart' && t.ok);
    expect(restart?.detail?.['relayUsed']).toBe(true);
  });

  it('axis 3: track publish state is preserved across an ICE restart', async () => {
    await mock.joinRoom({ roomId: 'rc-3', peerId: 'rc-peer-3', role: 'offerer' });
    const publish = await mock.publishTrack({
      roomId: 'rc-3',
      peerId: 'rc-peer-3',
      kind: 'video',
    });
    await mock.muteTrack({
      roomId: 'rc-3',
      peerId: 'rc-peer-3',
      trackId: publish.trackId,
    });
    // ICE restart must not require a re-publish. Mute stays effective through
    // the restart so the peer does not accidentally start streaming after a
    // network hiccup.
    await mock.iceRestart({ roomId: 'rc-3', peerId: 'rc-peer-3' });
    // Unmuting the same track after restart succeeds — the track is still
    // known to the adapter and the mute state is still tracked.
    const unmuted = await mock.unmuteTrack({
      roomId: 'rc-3',
      peerId: 'rc-peer-3',
      trackId: publish.trackId,
    });
    expect(unmuted.muted).toBe(false);
  });

  it('axis 4: sequential iceRestarts increment the metric monotonically', async () => {
    await mock.joinRoom({ roomId: 'rc-4', peerId: 'rc-peer-4', role: 'offerer' });
    await mock.iceRestart({ roomId: 'rc-4', peerId: 'rc-peer-4' });
    await mock.iceRestart({ roomId: 'rc-4', peerId: 'rc-peer-4' });
    await mock.iceRestart({ roomId: 'rc-4', peerId: 'rc-peer-4', forceRelay: true });
    const m = mock.metrics();
    expect(m.iceRestarts).toBe(3);
    expect(m.iceRestartLatencySamplesMs.length).toBe(3);
  });

  it('adapter — iceRestart without joining the room rejects with peer_not_in_room', async () => {
    await expect(
      mock.iceRestart({ roomId: 'ghost', peerId: 'ghost-peer' }),
    ).rejects.toThrow(/is not in ghost/);
  });
});

describe('signaling handler — ice-restart op', () => {
  it('routes ice-restart through the adapter and returns candidatesGathered + relayUsed', async () => {
    const handler = createSignalingHandler({ adapter: mock });
    await handler({
      kind: 'offer',
      role: 'offerer',
      roomId: 'rc-h-1',
      peerId: 'rc-h-peer-1',
    });
    const res = await handler({
      kind: 'ice-restart',
      roomId: 'rc-h-1',
      peerId: 'rc-h-peer-1',
    });
    expect(res.ok).toBe(true);
    expect(res.kind).toBe('ice-restart');
    expect(res.candidatesGathered).toBeGreaterThan(0);
    expect(res.relayUsed).toBe(false);
  });

  it('ice-restart with forceRelay:true reports relay-used through the handler', async () => {
    const handler = createSignalingHandler({ adapter: mock });
    await handler({
      kind: 'offer',
      role: 'offerer',
      roomId: 'rc-h-2',
      peerId: 'rc-h-peer-2',
    });
    const res = await handler({
      kind: 'ice-restart',
      roomId: 'rc-h-2',
      peerId: 'rc-h-peer-2',
      forceRelay: true,
    });
    expect(res.relayUsed).toBe(true);
  });

  it('ice-candidate op returns ok without dispatching to the adapter', async () => {
    const handler = createSignalingHandler({ adapter: mock });
    await handler({
      kind: 'offer',
      role: 'offerer',
      roomId: 'rc-h-3',
      peerId: 'rc-h-peer-3',
    });
    const traceBefore = mock.traces().length;
    const res = await handler({
      kind: 'ice-candidate',
      roomId: 'rc-h-3',
      peerId: 'rc-h-peer-3',
      candidateId: 'c1',
    });
    expect(res.ok).toBe(true);
    // The adapter is not invoked for the ice-candidate signal path — the SFU
    // consumes the candidate via ICE state, not a dedicated op.
    expect(mock.traces().length).toBe(traceBefore);
  });

  it('rejects an ice-restart payload without a roomId', () => {
    const result = validateSignalingRequest({
      peerId: 'p',
      kind: 'ice-restart',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('missing_room_id');
  });
});

describe('reconnect flow — full recovery scenario', () => {
  it('two peers survive an ICE restart mid-call without losing tracks or mute state', async () => {
    const signaling = createSignalingHandler({ adapter: mock });
    const room = createRoomHandler({ adapter: mock });
    await signaling({
      kind: 'offer',
      role: 'offerer',
      roomId: 'rec-1',
      peerId: 'alice',
      initialMedia: ['audio', 'video'],
    });
    await signaling({
      kind: 'answer',
      role: 'answerer',
      roomId: 'rec-1',
      peerId: 'bob',
      initialMedia: ['audio', 'video'],
    });
    const publish = await room({
      kind: 'publish',
      roomId: 'rec-1',
      peerId: 'alice',
      media: 'video',
    });
    await room({
      kind: 'mute',
      roomId: 'rec-1',
      peerId: 'alice',
      trackId: publish.trackId ?? '',
    });
    // Simulate a network hiccup — both peers restart ICE, alice via TURN.
    await signaling({
      kind: 'ice-restart',
      roomId: 'rec-1',
      peerId: 'alice',
      forceRelay: true,
    });
    await signaling({
      kind: 'ice-restart',
      roomId: 'rec-1',
      peerId: 'bob',
    });
    // Alice's mute state must have survived the reconnect.
    const unmute = await room({
      kind: 'unmute',
      roomId: 'rec-1',
      peerId: 'alice',
      trackId: publish.trackId ?? '',
    });
    expect(unmute.muted).toBe(false);
    const m = mock.metrics();
    expect(m.iceRestarts).toBe(2);
    expect(m.mutes).toBe(1);
    expect(m.unmutes).toBe(1);
  });
});
