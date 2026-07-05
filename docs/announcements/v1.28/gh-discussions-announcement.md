# kiwa v1.28 released — Realtime 深化 II (WebRTC + WebTransport + HTTP/3 + QUIC multiplexing + 3 dogfood app + real driver env-gate)

v1.28 is out. After v1.13 landed `@kiwa-test/realtime` v0.1 with 4 providers (Supabase / Ably / Pusher / Socket.io) and 5 base semantics (presence / broadcast / postgres_changes / room / reconnect), v1.28 stacks **advanced realtime production semantics 8 axis across WebRTC / WebTransport / HTTP/3 / QUIC + 3 dogfood apps (Next.js WebRTC video + Nuxt WebTransport stream + SvelteKit HTTP/3 multiplex) + real driver env-gate**. Every axis is a `packages/realtime/src/semantics/*` pure state-machine helper (no adapter, no browser, no signaling server) so tests / fixtures / release gates run deterministically. `@kiwa-test/realtime` v0.1.1 → v0.2.0 minor bump reflects the advanced-transport surface addition — the v0.1 API (4 provider mock + 5 base semantics) stays completely intact.

## What shipped

- **`@kiwa-test/realtime` v0.2.0** (advanced realtime semantics 8 axis + 24-row 3×8 grid harness + real driver env-gate minor bump). v0.1's 4 provider mock (`createSupabaseRealtimeMock` / `createAblyMock` / `createPusherMock` / `createSocketIoMock`) + 5 base semantics (`presence` / `broadcast` / `postgres_changes` / `room` / `reconnect`) keep every prior signature. v0.2 layers 8 axis on top: `webrtc-signaling` (offer/answer + SDP + ICE candidate + renegotiation) / `webrtc-data-channel` (ordered/unordered + reliable + maxRetransmits + binaryType) / `webrtc-media-track` (getUserMedia mock + MediaStream + simulcast + track add/remove) / `webrtc-ice-stun-turn` (candidate gathering + connectivity check + TURN relay + trickle ICE) / `webtransport-unidirectional` (uni stream + Datagram + reset) / `webtransport-bidirectional` (bi stream + flow control + backpressure) / `http3-push` (server push + prioritization + push_promise + cancellation) / `quic-multiplexing` (stream multiplex + stream priority + HPACK + 0-RTT resumption). Existing v0.1 caller paths stay unchanged — no v0.1 caller is asked to migrate.
- **v1.28-1 realtime v0.2 advanced semantics** (Issue #977). 8 axis × 3 protocol = 24 row fidelity grid + real-vs-mock fidelity harness + 60 semantics behavior test + real driver env-gate for v1.13 4 provider (Supabase / Ably / Pusher / Socket.io). Each axis is a pure state-machine helper with strict transition guard — deterministic, adapter-free, network-free.
- **v1.28-2 dogfood-nextjs-webrtc-video-app** (Issue #978). Next.js 15 App Router + mediasoup SFU + coturn TURN server (testcontainers) + WebRTC video/audio track + P2P peer connection + simulcast + ICE restart. Realtime video call room + track add/remove + reconnect on network flap + 36 vitest all-PASS with `KIWA_MODE=real` env-gate for coturn opt-in.
- **v1.28-3 dogfood-nuxt-webtransport-stream-app** (Issue #979). Nuxt 3 + WebTransport unidirectional + bidirectional stream + HTTP/3 + Datagram + connection migration + 0-RTT resumption. Edge streaming with backpressure + connection migration across network change + aioquic testcontainers fidelity harness + 30 vitest all-PASS.
- **v1.28-4 dogfood-sveltekit-http3-multiplex-app** (Issue #980, #982 follow-up). SvelteKit + nginx-quic HTTP/3 + QUIC multiplex + stream priority + HPACK dynamic table + 0-RTT resumption. Multi-stream + priority scheduling + HPACK observation + close-stream FIN + priority range validation + 0-RTT origin isolation + HPACK metrics teardown + 32 vitest + 4 adversarial-review findings addressed (closeStream FIN + HPACK metrics teardown + 0-RTT origin isolation + priority range).
- **v1.28-5 docs 補強** (Issue #983). tutorial 52 (WebRTC video signaling + SFU vs P2P) + tutorial 53 (WebTransport stream + HTTP/3 Datagram) + tutorial 54 (HTTP/3 multiplex + HPACK + 0-RTT) + concept doc `webrtc-webtransport-testing.md` (8 axis SSOT + P2P vs SFU 選択規範 + 3 protocol fidelity table) + migration guide `v1.27-to-v1.28.md` (additive-only, breaking change 0) + snippet validation `packages/realtime/tests/docs-tutorial-v1.28.test.ts` (30 test) re-runs every tutorial code snippet against the real `@kiwa-test/realtime` v0.2 API so drift is structurally blocked.
- **v1.28-6 publish** (Issue #976, this PR). plugin.json 1.27.0 → 1.28.0 + description v1.27 → v1.28 marker + new WebRTC / WebTransport / QUIC / HPACK keywords + Roadmap ✅ v1.28 row + announcement 4 file + release-smoke `v1-28-publish.test.ts` (7 axis publish artefact invariant) + docs-e2e `V1_28_PAGES` (4 page render check) + **release script filter check** — verify `@kiwa-test/realtime` present in both build (`-F`) and publish (`--filter`) halves (v1.14 payment omission + v1.25 perf-harness + v1.27 quality-metrics lesson, 4th application of the same systematic root-cause pattern).

## Numbers

- **6 sub-Issues resolved** (#977 / #978 / #979 / #980 / #983 / #976)
- **6 PRs merged** (v1.28-1 through v1.28-6 + follow-up #982 adversarial-review)
- **1 npm minor bump** (`@kiwa-test/realtime` v0.1.1 → v0.2.0) — kiwa runtime fixture count stays 34
- **8 axes** on advanced realtime semantics (`webrtc-signaling` / `webrtc-data-channel` / `webrtc-media-track` / `webrtc-ice-stun-turn` / `webtransport-unidirectional` / `webtransport-bidirectional` / `http3-push` / `quic-multiplexing`)
- **3 protocol** (WebRTC / WebTransport / HTTP/3) × 8 axis = **24 row fidelity grid**
- **3 dogfood apps** (Next.js + mediasoup SFU + coturn / Nuxt + WebTransport + aioquic / SvelteKit + nginx-quic HTTP/3) — 36 + 30 + 32 = **98 dogfood vitest** total
- **30 snippet-validation tests** in `packages/realtime/tests/docs-tutorial-v1.28.test.ts`

## Why 8 axes (and not one universal realtime abstraction)

Realtime tests without a per-protocol split fail three ways.

- **Protocol-shape drift**. WebRTC's SDP negotiation is a 4-step offer/answer roundtrip with ICE trickle interleaved; WebTransport's stream setup is a single-shot HTTP/3 CONNECT with unidirectional / bidirectional flag; HTTP/3 push is a server-initiated `PUSH_PROMISE` frame gated by client `SETTINGS_ENABLE_PUSH`. Wrapping all three in one abstraction hides the ordering guarantees each protocol makes — a test that "works with WebRTC and WebTransport" may pass by accident because both happen to converge on the same happy-path event order. The 8-axis SSOT names the **shape** each protocol enforces: `webrtc-signaling` for SDP offer/answer, `webtransport-unidirectional` for one-way streams, `http3-push` for server push.
- **Fidelity grid drift**. Without a per-protocol × per-axis grid, "realtime coverage" is a single vague number. The 24-row 3×8 grid pins exactly which protocol × axis pair a test exercises, so a fidelity regression on WebRTC data-channel `reliable` mode is visible as a single cell change — not a percentage that could shift for any of 24 reasons.
- **Real driver drift**. Pure-mock WebRTC tests can hide bugs that only surface with real ICE gathering + TURN relay + STUN binding. Real-driver testcontainers (coturn / aioquic / nginx-quic) run behind the same axis names + fidelity grid + strict transition guard as the mock path, so `KIWA_MODE=real` opts a test into real transport with zero code change to the assertions.

The 4 rules in `docs/concepts/webrtc-webtransport-testing.md` — 8 axis SSOT / 3 protocol neutral state machine / 24-row fidelity grid / real driver env-gate — are the smallest set that make kiwa realtime suites comparable across protocols, milestones, and forks.

## 17-milestone streak

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth) → v1.17 (Observability v2) → v1.18 (Blockchain depth) → v1.19 (Framework depth) → v1.20 (Streaming depth) → v1.21 (Auth depth) → v1.22 (Auth depth II) → v1.23 (Payment depth) → v1.24 (Edge / Serverless depth) → v1.25 (Perf-harness sweep) → v1.26 (Database depth) → v1.27 (Mutation testing sweep) → **v1.28 (Realtime depth II)**. Every milestone since v1.11 has landed 6 sub-Issues in full.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100 % milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth II (SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB)
- Perf-harness sweep II — real-machine baseline (macOS ARM64 + Linux x86_64 + Windows x86_64 3 hardware matrix + CI reproducibility harness)
- Mutation sweep II — property-based mutation (Stryker + fast-check integration + shrink parser)
- Realtime depth III — WebCodecs / WebGPU compute + AV1/VP9 hardware encoding + WHIP/WHEP ingest fidelity

Feedback welcome on which of these should land next.
