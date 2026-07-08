# WebRTC / WebTransport / HTTP/3 testing SSOT — 8-axis grid + P2P vs SFU + ICE trickle vs half-trickle + WebTransport vs WebSocket for kiwa v1.28

Introduced in v1.28 as `@kiwa/realtime` v0.2 — 3 protocol × 8 axis low-layer transport mocks (`createWebRtcSignalingMock` + `createWebRtcIceMock` + `createWebRtcTrackMock` + `createWebRtcDataChannelMock` + `createWebTransportUniMock` + `createWebTransportBiMock` + `createHttp3PushMock` + `createQuicMultiplexMock`) + 24-row `SEMANTICS_GRID` + `resolveRealtimeDriver` env-gate. This document is the SSOT for **what an advanced-realtime kiwa suite measures, which protocol handles which axis, and how to pick between the two most common architectural choices (P2P vs SFU, WebTransport vs WebSocket)**. Every downstream axis mock (`packages/realtime/src/semantics/*.ts`) and every dogfood app adapter (`examples/dogfood-*/src/adapters/interface.ts`) reads these rules from here — do not re-derive them locally.

## Why an advanced-realtime SSOT

Realtime tests without a shared standard fail three ways.

- **Protocol / axis conflation**. WebRTC signaling and WebRTC ICE both surface in an `RTCPeerConnection` lifecycle, but they measure different failure modes. Signaling fidelity is about SDP negotiation shape (offer / answer ordering, media section count, BUNDLE flag); ICE fidelity is about candidate gathering + connectivity check state machine (`new → gathering → complete`, `new → checking → connected`). A single "WebRTC test" that conflates them cannot pin down which one regressed. The 8-axis SSOT names each measurable surface separately.
- **Mock vs real drift**. WebRTC + WebTransport + HTTP/3 all specify complex asynchronous state machines. A hand-written mock that gets a state transition wrong (e.g. ICE `checking → connected` without an active candidate pair) can pass thousands of tests while silently diverging from real Chrome + aioquic behavior. The `@kiwa/realtime` v0.2 mocks pin the state machine transitions to a shared spec so a fidelity harness diff catches the drift.
- **Architecture choice masking bugs**. A test that mocks the SFU signaling shape (mediasoup) does not exercise P2P `RTCDataChannel` negotiation, and vice versa. Choosing the wrong architecture at the test level masks the bugs the app hits in production. The concept doc records the P2P vs SFU + WebTransport vs WebSocket decision criteria so tests pick the shape their app actually ships.

The 4 rules below are the smallest set that make advanced-realtime kiwa suites comparable across the 3 protocols, 8 axes, and 3 dogfood apps.

## Rule 1 — 8 axes, one measurable surface per axis

The v1.28 milestone pins the advanced transport surface to 8 axes. Each axis measures one specific transport behavior — signaling shape, ICE state machine, media track lifecycle, DataChannel semantics, uni stream lifecycle, bi stream flow control, HTTP/3 push priority, QUIC stream multiplex — and is exposed through one `SemanticsMock` type. The 8 mocks + their event kinds live in `packages/realtime/src/semantics/`.

| Axis | Protocol | Mock | Event kinds emitted | What it measures |
|---|---|---|---|---|
| `webrtc-signaling` | `webrtc` | `createWebRtcSignalingMock` | `offer` / `answer` / `ice-candidate` / `renegotiation` | SDP offer / answer negotiation shape + trickle ICE emission from signaling + renegotiation on track add |
| `webrtc-ice` | `webrtc` | `createWebRtcIceMock` | `ice-gathering` / `ice-checking` / `ice-connected` / `ice-relay-used` | ICE gathering / connectivity check state machine + TURN relay fallback + trickle candidate emission |
| `webrtc-track` | `webrtc` | `createWebRtcTrackMock` | `track-add` / `track-remove` / `track-mute` / `track-unmute` | `getUserMedia` shape + `MediaStream` lifecycle + simulcast layer (low / med / high with 100k / 300k / 900k default bitrates) |
| `webrtc-data-channel` | `webrtc` | `createWebRtcDataChannelMock` | `data-open` / `data-message` / `data-close` | `RTCDataChannel` ordered / unordered + `maxRetransmits` + `binaryType` (arraybuffer / blob) semantics |
| `webtransport-uni` | `webtransport` | `createWebTransportUniMock` | `uni-stream-open` / `uni-stream-write` / `uni-stream-reset` / `datagram-recv` | Unidirectional stream lifecycle + Datagram send + writer.abort() reset |
| `webtransport-bi` | `webtransport` | `createWebTransportBiMock` | `bi-stream-open` / `bi-stream-write` / `bi-stream-close` / `bi-backpressure` | Bidirectional stream + flow-control window + backpressure emission at window boundary + reader.read() |
| `http3-push` | `http3-quic` | `createHttp3PushMock` | `push-promise` / `push-headers` / `push-body` / `push-cancelled` | Server push_promise + RFC 9218 priority (urgency 0-7 + incremental flag) + cancellation |
| `quic-multiplex` | `http3-quic` | `createQuicMultiplexMock` | `stream-open` / `stream-close` / `hpack-insert` / `zero-rtt-used` | QUIC stream multiplex + priority (0-255, low = high) + HPACK dynamic table growth + 0-RTT resumption |

The `SemanticsProtocol` enum is `'webrtc' | 'webtransport' | 'http3-quic'`, and the `SemanticsAxis` enum lists all 8 axis identifiers. A caller cannot introduce a 9th axis without extending both enums — the type system refuses.

## Rule 2 — 24-row fidelity grid, applicable / non-applicable per pair

The 3 × 8 = 24 pair matrix is captured in `SEMANTICS_GRID`. Every pair is one of:

- **`applicable: true`** — the axis measures a real behavior of that protocol. WebRTC × signaling / ICE / track / data-channel = 4 applicable pairs. WebTransport × uni / bi = 2 applicable pairs. HTTP/3 + QUIC × push / multiplex = 2 applicable pairs. **Total: 8 applicable pairs**, matching the 8 axes above.
- **`applicable: false`** — the axis is meaningful for a different protocol. WebRTC × webtransport-uni = false (WebRTC has no `WebTransport.createUnidirectionalStream`). HTTP/3 + QUIC × webrtc-signaling = false. **Total: 16 non-applicable pairs**.

The grid is not just documentation — `measureSemanticsGrid({ scenarios })` iterates it and returns exactly 24 result rows, with non-applicable rows emitting a placeholder `{ eventsEmitted: 0, streamsOpened: 0, ... }`. Downstream matrix rendering does not need to fill gaps; the runtime and the doc agree by construction.

```ts
import { measureSemanticsGrid, SEMANTICS_GRID } from '@kiwa/realtime';

// SEMANTICS_GRID.length === 24
// SEMANTICS_GRID.filter(r => r.applicable).length === 8
const rows = await measureSemanticsGrid({ scenarios: new Map([...]) });
// rows.length === 24
```

### Protocol × framework fidelity table

The v1.28 milestone ships 3 dogfood apps that pair one framework with one protocol. The pairing is deliberate — each framework's runtime characteristics amplify a different axis, and the concept doc records the choice so a reader can see which framework hosts which axis in production.

| Framework | Protocol | Dogfood app | Axes exercised end-to-end | Real driver |
|---|---|---|---|---|
| Next.js 15 | WebRTC | `dogfood-nextjs-webrtc-video-app` | `webrtc-signaling` + `webrtc-ice` + `webrtc-track` (simulcast) | mediasoup SFU + coturn TURN under `WEBRTC_MEDIASOUP_READY=1` |
| Nuxt 3 | WebTransport | `dogfood-nuxt-webtransport-stream-app` | `webtransport-uni` + `webtransport-bi` (backpressure) + Datagram + connection migration | aioquic + Chrome experimental flag under `WEBTRANSPORT_KEY=1` |
| SvelteKit | HTTP/3 + QUIC | `dogfood-sveltekit-http3-multiplex-app` | `quic-multiplex` (priority scheduling) + HPACK + 0-RTT + `http3-push` | nginx-quic testcontainers under `HTTP3_KEY=1` |

The mapping is not exclusive — a Next.js app can perfectly well use WebTransport, and a SvelteKit app can host WebRTC. The dogfood pairing exists because *specific* combinations tend to co-occur in production (Next.js + mediasoup video call rooms, Nuxt 3 SSR + aioquic streaming feeds, SvelteKit + nginx-quic for edge-cached HTTP/3 delivery).

## Rule 3 — P2P vs SFU selection guide (WebRTC)

WebRTC has two dominant deployment shapes. The 8-axis grid is protocol-neutral, but the *scenario a test exercises* depends on which shape the app uses in production.

### P2P (peer-to-peer)

Two browsers negotiate directly through an STUN server, TURN relays only kick in when NAT traversal fails. Signaling is a lightweight WebSocket / long-polling channel (Socket.io / SSE / plain WS). No SFU sits in the middle — media flows peer-to-peer.

- **Use when**: 2-participant calls (1:1 chat, Google Meet 1:1, Whereby small rooms, Discord voice DMs). Signaling volume is O(N) per room. Media bandwidth is O(N²) per participant so P2P does not scale past ~4-5 participants without hitting client bandwidth ceilings.
- **Axes to exercise**: `webrtc-signaling` (offer / answer exchange over the signaling channel) + `webrtc-ice` (candidate gathering + STUN + TURN relay fallback) + `webrtc-data-channel` (if the app uses `RTCDataChannel` for chat / file transfer alongside the media). Skip `webrtc-track` if the app is data-only.
- **Fidelity anchor**: SDP fingerprint per peer must be unique. The mock's per-peer seed offset (Knuth multiplicative hash 2654435761 × peerSeq) is the invariant that catches accidental identity collisions — real mediasoup transports never produce identical DTLS fingerprints per peer.

### SFU (Selective Forwarding Unit)

An SFU (mediasoup, Janus, LiveKit, Jitsi) sits between the peers. Each peer maintains one connection to the SFU; the SFU forwards media to every other peer selectively. Signaling is more complex (per-transport producer / consumer allocation), but media bandwidth per peer is O(1) so the room scales.

- **Use when**: 3+ participant conferences (Zoom, Google Meet 3+, Twitch live streams via SFU-relay, virtual events). Signaling volume is O(N × M) per room (M = producer count). Media bandwidth per peer is O(1) — the SFU absorbs the cross-multiplication.
- **Axes to exercise**: `webrtc-signaling` (per-transport SDP offer / answer + renegotiation on producer add / remove) + `webrtc-ice` (per-transport ICE + TURN relay for participants behind restrictive NATs) + `webrtc-track` (simulcast — the SFU picks a layer per consumer based on bandwidth). `webrtc-data-channel` is optional; some SFUs (LiveKit) support DataChannel forwarding, others (mediasoup default) do not.
- **Fidelity anchor**: simulcast layer preference must round-trip through `selectLayer(peer, track, layer)`. The layer decision is stored on the consumer, not the producer — the mock preserves the per-consumer preference map so a fidelity diff catches accidental producer-side layer state.

The `dogfood-nextjs-webrtc-video-app` uses the SFU shape (mediasoup) because 3+ participants is the realistic case. Its adapter has `selectLayer` as a first-class op; a P2P adapter would drop `selectLayer` and add explicit `RTCDataChannel` ops.

## Rule 4 — ICE trickle vs half-trickle + WebTransport vs WebSocket

Two low-level design decisions surface repeatedly in advanced-realtime test suites. The concept doc records the trade-off so tests pick the shape their production stack ships.

### ICE trickle vs half-trickle

- **Trickle ICE (RFC 8838)** — candidates are emitted as they are discovered and forwarded through the signaling channel to the peer. `pc.onicecandidate` fires N times before `iceGatheringState === 'complete'`. The peer can start connectivity checks before the full candidate set has arrived — first-byte latency drops from ~1500 ms (wait for gathering) to ~300 ms (first host candidate).
- **Half-trickle** — the offerer trickles candidates but the answerer waits for gathering to complete before sending the answer. Common in older signaling gateways that assume the SDP answer contains all `a=candidate:` lines. Adds ~800-1200 ms to the answerer-side handshake.
- **Non-trickle** — both sides wait for gathering to complete. Signaling channels that cannot handle multi-message candidate flows (some SIP-over-WebSocket bridges) fall back here.

The `@kiwa/realtime` v0.2 `createWebRtcSignalingMock` + `createWebRtcIceMock` emit candidates one-by-one via `emitIceCandidates(n)` / `startGathering(n)`. A trickle-ICE-aware app will assert on the number of `ice-candidate` events emitted; a half-trickle app will assert that the answer only sends after `ice-gathering` reaches state `complete`.

### WebTransport vs WebSocket

The two protocols look interchangeable from an application-code perspective — both are message-oriented client → server streams over TCP-like fabric. The differences show up under load, packet loss, and NAT rebinding.

| Concern | WebSocket (WS / WSS) | WebTransport (over HTTP/3 + QUIC) |
|---|---|---|
| Transport | TCP + TLS | QUIC (UDP + TLS 1.3) |
| Head-of-line blocking | Yes — one lost TCP packet blocks all data | No — QUIC streams are independent; a lost packet on stream 1 does not stall stream 2 |
| Multiple streams | One (message ordering guaranteed across all messages) | Many (bidirectional + unidirectional streams; independent flow control per stream) |
| Datagram support | No (application must fragment) | Yes (`transport.datagrams.writable` — unreliable, unordered) |
| Backpressure | Only via `bufferedAmount` polling | Per-stream `writer.ready` promise; per-datagram `datagrams.outgoingHighWaterMark` |
| Connection migration | No (breaks on network change) | Yes (QUIC path migration; connection survives NAT rebinding + roaming) |
| Handshake round trips | 2 RTT (TCP + TLS handshake) | 1 RTT (QUIC handshake), 0 RTT (with resumption ticket) |
| Firewall / proxy support | Universal | Restricted (UDP blocked in some corporate networks; falls back to WebSocket) |

- **Use WebSocket when**: the app runs behind restrictive corporate proxies (UDP often blocked), payload is small and infrequent (chat messages, presence pings), or the deployment target is a WebSocket-first framework (Socket.io / SignalR / SSE fallback).
- **Use WebTransport when**: the app streams large payloads with tight latency budgets (video / game state / financial ticks), the client roams (mobile app, Wi-Fi ↔ cellular), or the workload benefits from unreliable Datagrams (input events, telemetry samples). Falls back to WebSocket when UDP is blocked.

The `dogfood-nuxt-webtransport-stream-app` exercises the WebTransport shape end-to-end because the axis that most differentiates it from WebSocket (per-stream backpressure + connection migration + Datagram) is what the fidelity harness measures. A WebSocket-only app would not need `openBiStream` or `sendDatagram` or `migrateConnection` — dropping those ops from the adapter would signal the architectural difference at code level.

## The 3-layer harness alignment

`@kiwa/perf-harness` runs `serial + concurrent + memory` in one `runPerf3Layer` call. The advanced-realtime semantics harness is single-layer by design — each `measureSemanticsAxis` call runs one scenario against one mock and collects the event stream. The perf harness is 3-layer because contention + memory leaks slip past a serial p95; the realtime harness is 1-layer because concurrent stream measurement is already the *scenario itself* (`concurrentSend` opens N streams and measures priority ordering).

The kiwa release gate treats them as parallel axes.

| Axis | Layer | Cost | Runs when |
|---|---|---|---|
| `perf.p95Ms` (v1.13) | serial | ~90 s across 33 packages | every `pnpm test:perf` |
| perf 3-layer (v1.14) | serial + concurrent + memory | ~120 s per package | every `pnpm test:perf` |
| realtime 5-semantics fidelity (v1.13) | single | ~1 s per provider | every `pnpm test` |
| realtime 8-axis semantics fidelity (v1.28) | single | ~2 s per axis | every `pnpm test` |
| `mutation.tier` (v1.27-4) | single | ~200 s per package | every `pnpm test:mutation` |

The semantics fidelity axis is cheap (~2 s per axis, 16 s for all 8 in one `measureSemanticsGrid` call) so every kiwa suite runs it on every `pnpm test`. Mutation runs are still excluded from the default sweep because a 33-package × ~200 s run is ~110 minutes.

## Real driver env-gate

The `resolveRealtimeDriver({ provider, requiredKeys, createReal, createMock })` helper is the SSOT for opting into real drivers on the 4 v1.13 providers (Supabase / Ably / Pusher / Socket.io). It returns `createMock()` unless `KIWA_MODE=real` + every `requiredKeys` env variable is present — safe fallback by construction.

```ts
import { resolveRealtimeDriverByProvider } from '@kiwa/realtime';

const { driver, isReal, reason, missingKeys } = resolveRealtimeDriverByProvider(
  'supabase',
  (env) => createRealSupabaseDriver({ url: env.SUPABASE_URL!, key: env.SUPABASE_ANON_KEY! }),
  () => createMockSupabaseDriver(),
);
// isReal === false unless KIWA_MODE=real + SUPABASE_URL + SUPABASE_ANON_KEY are all set
```

The 3 v1.28 dogfood apps use a per-adapter env gate (not `resolveRealtimeDriver` directly) because their real driver reads app-specific env variables (`WEBRTC_MEDIASOUP_READY=1` / `WEBTRANSPORT_KEY=1` / `HTTP3_KEY=1`). The pattern is the same — refuse the real op with a code (`KIWA_WEBRTC_ENV_MISSING` / `KIWA_WEBTRANSPORT_ENV_MISSING` / `KIWA_HTTP3_ENV_MISSING`) until the env variables land, and the mock adapter is the always-available default.

## Package coverage (v1.28)

The v1.28 milestone applied the 8-axis grid to one package (`@kiwa/realtime`) and three dogfood apps.

| Layer | Packages / apps |
|---|---|
| SaaS (adapter, 1) | `@kiwa/realtime` v0.2 |
| Dogfood apps (3) | `dogfood-nextjs-webrtc-video-app` / `dogfood-nuxt-webtransport-stream-app` / `dogfood-sveltekit-http3-multiplex-app` |

Every dogfood app writes a per-app baseline JSON to `.mutation-baseline/{app}.json` (SaaS tier default 65 %), runs Stryker on every `pnpm test:mutation` invocation, and gates on the tier floor via `evaluateReleaseGate({ mutationTier: 'saas' })`.

## Where each axis lands in the release gate

The 12-axis release gate does not add a new axis in v1.28. The 8 realtime axes feed into the existing `fidelity.ratio` axis (v1.11) — one row of `SemanticsFidelityRow` per axis becomes one row of the mock vs real coverage matrix. A behavioral divergence between mock and real (event count mismatch, stream state divergence) reduces the fidelity ratio; a caller reading the release-gate report sees `mock covered / real total` per axis.

| Axis | Kind | Introduced | Threshold source |
|---|---|---|---|
| fidelity — ratio | floor | v1.11 (7-axis) | `ReleaseGateThresholds.fidelityRatio` (default 60 %, overrideable). v1.28 rows contribute per-axis coverage. |
| mutation — tier | floor | v1.27-4 (12-axis) | `DEFAULT_MUTATION_TIER_THRESHOLDS[tier]` — SaaS default 65 % for the 3 dogfood apps + `@kiwa/realtime` v0.2 |

The 8-axis grid is a *fidelity signal* — it improves the resolution of the `fidelity.ratio` axis without changing the axis count. Backward-compatible with every v1.11 – v1.27 consumer.

## Related

- [Tutorial 52 — WebRTC video call (signaling + ICE + simulcast + ICE restart walkthrough)](../tutorials/52-webrtc-video-signaling)
- [Tutorial 53 — WebTransport stream (uni / bi / Datagram / migration walkthrough)](../tutorials/53-webtransport-stream)
- [Tutorial 54 — HTTP/3 multiplex (stream priority + HPACK + 0-RTT walkthrough)](../tutorials/54-http3-multiplex)
- [Migration guide v1.27 → v1.28](../migrations/v1.27-to-v1.28)
- [Realtime testing (time-axis mock SSOT for the 5 v1.13 semantics)](./realtime-testing)
- [Release gate SSOT (12-axis)](../quality/release-gate)
- [Mutation testing SSOT (kill rate + 4-tier threshold + 12-axis integration)](./mutation-testing-ssot)
