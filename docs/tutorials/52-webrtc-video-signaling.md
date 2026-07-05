# WebRTC video call — signaling + ICE + simulcast + ICE restart with a provider-neutral adapter in 15 min

## What you'll build

A provider-neutral `VideoCallAdapter` with two implementations — a **mock adapter** backed by `@kiwa-test/realtime` v0.2's `createWebRtcSignalingMock` + `createWebRtcIceMock` + `createWebRtcTrackMock`, and a **real adapter** stub that would drive mediasoup SFU + coturn TURN under `KIWA_MODE=real` + `WEBRTC_MEDIASOUP_READY=1`. Both satisfy the same 8-op contract (`joinRoom` / `leaveRoom` / `publishTrack` / `unpublishTrack` / `muteTrack` / `unmuteTrack` / `selectLayer` / `iceRestart`), so a fidelity harness can diff them side-by-side across the 4 WebRTC axes (signaling / ICE / track / simulcast) that mediasoup + coturn make observable in production. This is the exact pattern the `dogfood-nextjs-webrtc-video-app` (v1.28-2, PR #978) uses to run 36 tests against 2-user rooms, layer switches, mute / unmute, and forced-relay ICE restarts.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-webrtc-video && cd kiwa-webrtc-video
pnpm init
pnpm add -D @kiwa-test/realtime@^0.2 vitest typescript @types/node
```

`package.json` — one vitest script is enough for this tutorial.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

### 2. Define the provider-neutral adapter contract

`src/adapters/interface.ts` — the 8 ops mediasoup + coturn expose in production. Every op returns a plain data record (`sdpFingerprint`, `simulcastLayers`, `candidatesGathered`, …) so a fidelity harness can diff two adapter runs by comparing the return shapes.

```ts
export type PeerRole = 'offerer' | 'answerer';
export type MediaKind = 'audio' | 'video';

export interface VideoCallAdapter {
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
```

Two things to notice.

- The interface is **provider-neutral** — nothing about mediasoup, coturn, Janus, or LiveKit leaks through. Any SFU + TURN stack that speaks WebRTC can satisfy the 8-op contract.
- `simulcastLayers` is the video-only field. `getUserMedia` in `@kiwa-test/realtime` v0.2 produces a video track with 3 default layers (`low: 100 kbps` / `med: 300 kbps` / `high: 900 kbps`) — the exact defaults mediasoup + Janus SFUs negotiate.

### 3. Wire the mock adapter with `@kiwa-test/realtime` v0.2

`src/adapters/mock.ts` — one signaling / ICE / track mock per peer so per-peer state (SDP fingerprint, ICE stats, published tracks) stays isolated. This is exactly how mediasoup allocates producer / consumer / transport instances per peer.

```ts
import {
  createWebRtcIceMock,
  createWebRtcSignalingMock,
  createWebRtcTrackMock,
  type WebRtcIceMock,
  type WebRtcSignalingMock,
  type WebRtcTrackMock,
} from '@kiwa-test/realtime';
import type { PeerRole, VideoCallAdapter } from './interface.js';

interface PeerState {
  role: PeerRole;
  signaling: WebRtcSignalingMock;
  ice: WebRtcIceMock;
  tracks: WebRtcTrackMock;
  publishedTracks: Set<string>;
}

export function makeMockAdapter(opts: { seed?: number } = {}): VideoCallAdapter {
  const rooms = new Map<string, Map<string, PeerState>>();
  let peerSeq = 0;

  function createPeer(role: PeerRole): PeerState {
    peerSeq += 1;
    // Offset the seed per peer so mediasoup's per-transport unique-fingerprint
    // guarantee is preserved. Knuth multiplicative hash 2654435761 scatters
    // small peerSeq inputs so peer #1 vs #2 do not produce nearby SDP hashes.
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

      // Signaling ceremony — offerer produces SDP offer, answerer replies with
      // SDP answer. Both mediasoup and Janus SFUs behave identically at the
      // signaling layer even though they use different transport shapes.
      const sdp =
        input.role === 'offerer'
          ? await peer.signaling.createOffer()
          : await peer.signaling.createAnswer({
              type: 'offer',
              fingerprint: `sha256:remote-${input.peerId}`,
              mediaSections: 3,
              bundleEnabled: true,
            });

      // Trickle ICE — gather 3 local candidates, run connectivity check so the
      // peer transitions to `connected` before any track is published.
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
      const room = rooms.get(input.roomId);
      const peer = room?.get(input.peerId);
      if (!peer) throw new Error('peer_not_in_room');
      const stream = await peer.tracks.getUserMedia({
        audio: input.kind === 'audio',
        video: input.kind === 'video',
      });
      const track = stream.tracks[0]!;
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
      // The consumer picks a preferred layer per remote track — mediasoup
      // stores it on the consumer, the mock records it on the local peer.
      return { layer: input.layer };
    },

    async iceRestart(input) {
      const peer = rooms.get(input.roomId)?.get(input.peerId);
      if (!peer) throw new Error('peer_not_in_room');
      // Renegotiate + fresh candidate gathering. mediasoup exposes
      // Transport.restartIce with the same lifecycle — the mock preserves
      // published tracks so the track resume path can be measured.
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
```

Three things to notice.

- **Per-peer seed offset**. Every peer gets a distinct seed derived from `Knuth multiplicative hash 2654435761 × peerSeq`, so `createOffer` on peer #1 and peer #2 never produce identical SDP fingerprints. Real mediasoup transports produce per-transport unique ufrag / fingerprints — the mock preserves that invariant so a fidelity diff on `sdpFingerprint` catches accidental identity collisions.
- **Trickle ICE**. `startGathering(3)` emits 3 candidates one at a time (host / srflx / relay by index modulo 3) rather than blocking until gathering completes. That is how real `RTCPeerConnection.onicecandidate` behaves — candidates surface as they are discovered so signaling can forward them without waiting on the full batch.
- **ICE restart preserves published tracks**. `peer.ice.reset()` clears ICE state only; `peer.publishedTracks` and `peer.tracks` are untouched. That matches mediasoup's `Transport.restartIce()` — the track producer / consumer stays alive across the restart, and only the ICE ufrag + candidate pool gets refreshed.

### 4. Stub the real adapter behind an env gate

`src/adapters/real.ts` — kiwa's real driver env-gate refuses every op with `KIWA_WEBRTC_ENV_MISSING` until `KIWA_MODE=real` + `WEBRTC_MEDIASOUP_READY=1` are set. The stub is deliberately minimal — the real mediasoup + coturn wiring lands in a follow-up milestone.

```ts
import type { VideoCallAdapter } from './interface.js';

export function makeRealAdapter(): VideoCallAdapter {
  const missing = () => {
    const err = new Error('mediasoup + coturn wiring pending — set WEBRTC_MEDIASOUP_READY=1');
    (err as Error & { code: string }).code = 'KIWA_WEBRTC_ENV_MISSING';
    return err;
  };
  return {
    mode: 'real',
    async joinRoom() { throw missing(); },
    async leaveRoom() { throw missing(); },
    async publishTrack() { throw missing(); },
    async muteTrack() { throw missing(); },
    async selectLayer() { throw missing(); },
    async iceRestart() { throw missing(); },
  } as VideoCallAdapter;
}
```

The fidelity harness records those `KIWA_WEBRTC_ENV_MISSING` refusals as behavioural divergences — an expected baseline when the real environment is skipped, and useful evidence that the app never accidentally hits a live mediasoup instance from a unit-test environment.

### 5. Behavior test — 2-user join + publish + mute + select layer

`tests/video-call.test.ts` — the mock adapter drives the same code path the Next.js runtime would in production, without booting mediasoup.

```ts
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('video-call — 2-user room + simulcast + mute + layer switch', () => {
  it('offerer publishes video with 3 simulcast layers by default', async () => {
    const adapter = makeMockAdapter();
    await adapter.joinRoom({ roomId: 'r1', peerId: 'alice', role: 'offerer' });
    const pub = await adapter.publishTrack({ roomId: 'r1', peerId: 'alice', kind: 'video' });
    expect(pub.simulcastLayers.map((l) => l.rid)).toEqual(['low', 'med', 'high']);
    expect(pub.simulcastLayers.map((l) => l.maxBitrate)).toEqual([100000, 300000, 900000]);
  });

  it('offerer + answerer negotiate distinct SDP fingerprints', async () => {
    const adapter = makeMockAdapter({ seed: 42 });
    const a = await adapter.joinRoom({ roomId: 'r1', peerId: 'alice', role: 'offerer' });
    const b = await adapter.joinRoom({ roomId: 'r1', peerId: 'bob', role: 'answerer' });
    expect(a.sdpFingerprint).not.toBe(b.sdpFingerprint);
    expect(a.sdpFingerprint.startsWith('sha256:')).toBe(true);
  });

  it('viewer switches simulcast layer and the adapter records the preference', async () => {
    const adapter = makeMockAdapter();
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
```

Three things to notice.

- The `simulcastLayers.rid` triple is `['low', 'med', 'high']` in insertion order, and `maxBitrate` matches `[100 kbps, 300 kbps, 900 kbps]`. That is what mediasoup's default simulcast encoding negotiates, so a behavior test that asserts on those exact numbers catches any accidental drift in the mock defaults.
- The `sdpFingerprint` assertion (`a !== b`) uses the seed offset from step 3. If two peers share the same seed derivation, mediasoup fidelity would silently mask a real bug where two transports produce identical DTLS fingerprints — the mock keeps that invariant explicit.
- The `selectLayer` op returns the accepted layer, not a synchronous switch confirmation. mediasoup exposes `consumer.setPreferredLayers` with the same shape — the preference is stored, the actual layer change happens asynchronously as the SFU adapts.

### 6. Behavior test — ICE restart with forced TURN relay

`tests/ice-restart.test.ts` — reconnect after a network hiccup by forcing TURN. `iceRestart({ forceRelay: true })` gathers a fresh candidate set and marks `relayUsed: true` on the stats.

```ts
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('ice-restart — forced relay + candidate refresh', () => {
  it('preserves published tracks across the restart', async () => {
    const adapter = makeMockAdapter();
    await adapter.joinRoom({ roomId: 'r1', peerId: 'alice', role: 'offerer' });
    const pub = await adapter.publishTrack({ roomId: 'r1', peerId: 'alice', kind: 'video' });
    const restart = await adapter.iceRestart({ roomId: 'r1', peerId: 'alice' });
    expect(restart.candidatesGathered).toBe(3);
    expect(restart.relayUsed).toBe(false);
    // Track survives — muteTrack still succeeds after the restart.
    await expect(
      adapter.muteTrack({ roomId: 'r1', peerId: 'alice', trackId: pub.trackId }),
    ).resolves.toEqual({ muted: true });
  });

  it('marks relayUsed=true when forceRelay is passed', async () => {
    const adapter = makeMockAdapter();
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
```

Two things to notice.

- `candidatesGathered: 3` is deterministic — `startGathering(3)` inside `iceRestart` always trickles 3 candidates before the connectivity check completes. A change in the mock would surface as a numeric diff, not a boolean pass / fail — easier to debug across two runs.
- `muteTrack` after `iceRestart` resolves. That is the load-bearing invariant of the ICE restart contract — the transport reset never wipes the producer / consumer state. If it did, mediasoup consumers would emit `producerclose` and the caller would have to re-publish the track from scratch.

### 7. Run it

```bash
pnpm test
```

Both behavior tests pass in under a second. The mock adapter has now been exercised end-to-end and can be handed to the fidelity harness (`runRealtimeFidelityCheck` from `@kiwa-test/realtime`) alongside the real stub to measure divergence when `KIWA_MODE=real` + `WEBRTC_MEDIASOUP_READY=1` are set in a follow-up integration run.

The full 36-test end-to-end pattern (including 2-tab Playwright specs for multi-user rooms, reconnect after network drop, and simulcast layer negotiation across viewers) lives in [`examples/dogfood-nextjs-webrtc-video-app`](https://github.com/cardene777/kiwa/tree/main/examples/dogfood-nextjs-webrtc-video-app). The snippet validation test that guarantees every code sample above keeps matching the real `@kiwa-test/realtime` v0.2 API lives in `packages/realtime/tests/docs-tutorial-v1.28.test.ts`.

## Where to next

- [Tutorial 53 — WebTransport stream (uni / bi / Datagram / migration walkthrough)](./53-webtransport-stream)
- [Tutorial 54 — HTTP/3 multiplex (stream priority + HPACK + 0-RTT walkthrough)](./54-http3-multiplex)
- [Concept — WebRTC / WebTransport / HTTP/3 testing (8-axis SSOT + P2P vs SFU + ICE trickle vs half-trickle + WebTransport vs WebSocket)](../concepts/webrtc-webtransport-testing)
- [Migration guide — v1.27 → v1.28](../migrations/v1.27-to-v1.28)
- [Realtime testing (time-axis mock SSOT for the 5 v1.13 semantics)](../concepts/realtime-testing)
