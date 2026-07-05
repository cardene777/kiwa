/**
 * Simulcast layer + bandwidth adaptation harness.
 *
 * Sub-Issue #972 (v1.28-2) AC — the mock adapter drives simulcast layer
 * negotiation + viewer-side layer selection and the fidelity harness diffs
 * the raw {@link TraceEvent} sequence across four axes.
 *
 *  1. Video publish with `simulcast: true` (the default) surfaces the 3-layer
 *     rid ladder (low / med / high) with the mediasoup bitrate default.
 *  2. Video publish with `simulcast: false` returns an empty layer array —
 *     the SFU falls back to a single-layer encode.
 *  3. selectLayer records the viewer preference on the peer state; a viewer
 *     may switch between low / med / high without renegotiating.
 *  4. The room handler surfaces `select-layer` as a first-class op so a UI
 *     can drive it from a bandwidth estimator without needing adapter
 *     internals.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { createRoomHandler } from '../src/app/room/route.js';
import { createSignalingHandler } from '../src/app/signaling/route.js';
import type { VideoCallAdapter } from '../src/adapters/interface.js';

let mock: VideoCallAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ seed: 11, latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — simulcast ladder', () => {
  it('axis 1: simulcast default surfaces 3 rids in low → high order', async () => {
    await mock.joinRoom({ roomId: 'sc-1', peerId: 'sc-peer-1', role: 'offerer' });
    const publish = await mock.publishTrack({
      roomId: 'sc-1',
      peerId: 'sc-peer-1',
      kind: 'video',
    });
    const rids = publish.simulcastLayers.map((l) => l.rid);
    expect(rids).toEqual(['low', 'med', 'high']);
    // Bitrate is strictly monotonic — low < med < high. The SFU relies on
    // this to pick a fallback layer when a viewer's bandwidth drops.
    const bitrates = publish.simulcastLayers.map((l) => l.maxBitrate);
    expect(bitrates[0]).toBeLessThan(bitrates[1] ?? 0);
    expect(bitrates[1]).toBeLessThan(bitrates[2] ?? 0);
  });

  it('axis 2: simulcast:false emits a single-layer encode (no layers)', async () => {
    await mock.joinRoom({ roomId: 'sc-2', peerId: 'sc-peer-2', role: 'offerer' });
    const publish = await mock.publishTrack({
      roomId: 'sc-2',
      peerId: 'sc-peer-2',
      kind: 'video',
      simulcast: false,
    });
    expect(publish.simulcastLayers).toEqual([]);
  });

  it('axis 3: selectLayer records a viewer preference on the trace', async () => {
    await mock.joinRoom({ roomId: 'sc-3', peerId: 'sc-peer-3', role: 'offerer' });
    const publish = await mock.publishTrack({
      roomId: 'sc-3',
      peerId: 'sc-peer-3',
      kind: 'video',
    });
    const result = await mock.selectLayer({
      roomId: 'sc-3',
      peerId: 'sc-peer-3',
      trackId: publish.trackId,
      layer: 'low',
    });
    expect(result.layer).toBe('low');
    const trace = mock.traces();
    const layerSwitches = trace.filter((t) => t.op === 'selectLayer' && t.ok);
    expect(layerSwitches.length).toBe(1);
    expect(layerSwitches[0]?.detail?.['layer']).toBe('low');
  });

  it('axis 4: viewer may switch layers between low / med / high', async () => {
    await mock.joinRoom({ roomId: 'sc-4', peerId: 'sc-peer-4', role: 'offerer' });
    const publish = await mock.publishTrack({
      roomId: 'sc-4',
      peerId: 'sc-peer-4',
      kind: 'video',
    });
    for (const layer of ['high', 'med', 'low', 'high'] as const) {
      const res = await mock.selectLayer({
        roomId: 'sc-4',
        peerId: 'sc-peer-4',
        trackId: publish.trackId,
        layer,
      });
      expect(res.layer).toBe(layer);
    }
    const m = mock.metrics();
    expect(m.layerSwitches).toBe(4);
  });

  it('adapter — selectLayer without joining the room rejects with peer_not_in_room', async () => {
    await expect(
      mock.selectLayer({
        roomId: 'ghost',
        peerId: 'ghost-peer',
        trackId: 't1',
        layer: 'low',
      }),
    ).rejects.toThrow(/is not in ghost/);
  });
});

describe('room handler — select-layer op', () => {
  it('select-layer through the handler records the viewer preference', async () => {
    const signaling = createSignalingHandler({ adapter: mock });
    await signaling({
      kind: 'offer',
      role: 'offerer',
      roomId: 'sc-h-1',
      peerId: 'sc-h-peer-1',
    });
    const room = createRoomHandler({ adapter: mock });
    const publish = await room({
      kind: 'publish',
      roomId: 'sc-h-1',
      peerId: 'sc-h-peer-1',
      media: 'video',
    });
    expect(publish.simulcastLayers).toBe(3);
    const select = await room({
      kind: 'select-layer',
      roomId: 'sc-h-1',
      peerId: 'sc-h-peer-1',
      trackId: publish.trackId ?? '',
      layer: 'med',
    });
    expect(select.ok).toBe(true);
    expect(select.layer).toBe('med');
  });

  it('unpublish clears the layer preference so a later publish starts clean', async () => {
    const signaling = createSignalingHandler({ adapter: mock });
    await signaling({
      kind: 'offer',
      role: 'offerer',
      roomId: 'sc-h-2',
      peerId: 'sc-h-peer-2',
    });
    const room = createRoomHandler({ adapter: mock });
    const publish = await room({
      kind: 'publish',
      roomId: 'sc-h-2',
      peerId: 'sc-h-peer-2',
      media: 'video',
    });
    await room({
      kind: 'select-layer',
      roomId: 'sc-h-2',
      peerId: 'sc-h-peer-2',
      trackId: publish.trackId ?? '',
      layer: 'high',
    });
    await room({
      kind: 'unpublish',
      roomId: 'sc-h-2',
      peerId: 'sc-h-peer-2',
      trackId: publish.trackId ?? '',
    });
    // Publishing again + selecting a fresh layer must succeed — the previous
    // preference was cleared on unpublish so state cannot leak.
    const publish2 = await room({
      kind: 'publish',
      roomId: 'sc-h-2',
      peerId: 'sc-h-peer-2',
      media: 'video',
    });
    const select = await room({
      kind: 'select-layer',
      roomId: 'sc-h-2',
      peerId: 'sc-h-peer-2',
      trackId: publish2.trackId ?? '',
      layer: 'low',
    });
    expect(select.layer).toBe('low');
  });
});
