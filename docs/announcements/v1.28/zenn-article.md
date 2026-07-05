---
title: "kiwa v1.28 released — Realtime 深化 II (WebRTC + WebTransport + HTTP/3 + QUIC multiplexing + 3 dogfood app + real driver env-gate)"
emoji: "📡"
type: "tech"
topics: ["oss", "typescript", "webrtc", "webtransport", "kiwa"]
published: true
---

# kiwa v1.28 released

v1.28 は kiwa の 18 milestone 目です。 v1.13 (時間軸、 `@kiwa-test/realtime` v0.1 で 4 provider Supabase / Ably / Pusher / Socket.io × 5 base semantics 統一 mock を land) を基盤に、 v1.28 は同 provider mock の上に **advanced realtime production semantics 8 axis (WebRTC + WebTransport + HTTP/3 + QUIC multiplexing) + 3 dogfood app + real driver env-gate + protocol-neutral state machine + strict transition guard** を land。 v0.1 4 provider mock + 5 base semantics API (`presence` / `broadcast` / `postgres_changes` / `room` / `reconnect`) は first-line contract のまま維持 (v0.1 signature 完全維持)、 8 新 axis (`webrtc-signaling` / `webrtc-data-channel` / `webrtc-media-track` / `webrtc-ice-stun-turn` / `webtransport-unidirectional` / `webtransport-bidirectional` / `http3-push` / `quic-multiplexing`) は second-line envelope として並走。 `@kiwa-test/realtime` v0.1.1 → v0.2.0 minor bump は 8 axis advanced-transport semantics + 24-row 3×8 fidelity grid + real driver env-gate を反映。 v1.11 以降の連続完遂 17 milestone (release gate → 非決定性 → 時間軸 → 横軸拡張 → AI-LLM 深化 → component 縦軸 → Observability v2 → Blockchain 深化 → Framework 深化 → Streaming 深化 → Auth 深化 → Auth 深化 II → Payment 深化 → Edge / Serverless 深化 → Perf-harness sweep → Database 深化 → Mutation testing sweep) を受けて、 v1.28 は Realtime 深化 II milestone、 kiwa runtime fixture 34 packages はそのまま維持 (realtime 既存 package の minor 拡張)。

## 主な追加

### `@kiwa-test/realtime` v0.2.0 (advanced realtime semantics 8 axis + 24-row 3×8 grid + real driver env-gate)

v1.13 で land した 4 provider mock (`createSupabaseRealtimeMock` / `createAblyMock` / `createPusherMock` / `createSocketIoMock`) + 5 base semantics (`presence` / `broadcast` / `postgres_changes` / `room` / `reconnect`) の signature を完全維持したまま、 v1.28 は `packages/realtime/src/semantics/*` に 8 axis の pure state-machine helper を追加。 全 helper は pure function (no adapter / no browser / no signaling server) で決定論的、 test / fixture / release gate で reproducible。

- `webrtc-signaling.ts` — offer / answer + SDP + ICE candidate + renegotiation (4 step SDP negotiation state machine + ICE trickle interleave)
- `webrtc-data-channel.ts` — ordered / unordered + reliable + maxRetransmits + binaryType (`arraybuffer` / `blob`)
- `webrtc-media-track.ts` — getUserMedia mock + MediaStream + simulcast + track add / remove (video / audio track lifecycle)
- `webrtc-ice-stun-turn.ts` — candidate gathering + connectivity check + TURN relay + trickle ICE (STUN binding + TURN allocate)
- `webtransport-unidirectional.ts` — uni stream + Datagram + reset (HTTP/3 CONNECT + unidirectional flag)
- `webtransport-bidirectional.ts` — bi stream + flow control + backpressure (bidirectional stream + credit-based flow)
- `http3-push.ts` — server push + prioritization + `PUSH_PROMISE` + cancellation (`SETTINGS_ENABLE_PUSH` gate)
- `quic-multiplexing.ts` — stream multiplex + stream priority + HPACK dynamic table + 0-RTT resumption

### 4 rule SSOT

`docs/concepts/webrtc-webtransport-testing.md` は kiwa realtime 全 protocol の 4 rule を単一 SSOT 化。

1. **8 axis SSOT** — WebRTC / WebTransport / HTTP/3 を単一「realtime」抽象で wrap しない。 各 protocol の shape を axis 名で名指しし、 fidelity regression は 24 row grid 上の単一 cell 変化として surface する。 `webrtc-data-channel` reliable mode の regression は「`webrtc-data-channel` × `Ably` cell が FAIL」 として visible、 24 のいずれかで shift しうる percentage ではない。
2. **3 protocol neutral state machine** — WebRTC / WebTransport / HTTP/3 の 3 protocol は共通の event 名 routing table (`emit` / `on` / `close` / `error`) に neutralize、 provider-specific transition table は各 axis file 内 pure function に閉じ込め。 protocol 越しの assertion は同 event 名で書ける、 protocol 越しの regression は同 assertion で catch できる。
3. **24-row fidelity grid** — 8 axis × 3 protocol = 24 row grid、 各 cell は「axis × protocol」 pair の fidelity を single boolean で expose。 `collectFidelityCoverage()` は 24 row grid を JSON で return、 release-gate は grid の PASS 率を fidelity axis に統合。 「realtime coverage 87 %」 のような percentage は使わない (24 のいずれかで shift しうるため)。
4. **real driver env-gate** — v1.13 4 provider mock は default で pure mock、 `KIWA_MODE=real` env-gate で real driver (coturn / aioquic / nginx-quic testcontainers) に opt-in。 real driver path は同じ axis 名 + fidelity grid + strict transition guard を使うので、 mock → real の切替は env 1 個 (`KIWA_MODE=real`) で完結、 assertion は 1 行も変えない。

### v1.28-1 realtime v0.2 advanced semantics (Issue #977)

`@kiwa-test/realtime` v0.2 で 8 axis × 3 protocol = 24 row fidelity grid + real-vs-mock fidelity harness + 60 semantics behavior test + v1.13 4 provider (Supabase / Ably / Pusher / Socket.io) に real driver env-gate 追加。 各 axis file は pure state-machine helper で strict transition guard、 決定論的・ adapter-free・ network-free。 `packages/realtime/src/semantics/*` 8 file + 60 vitest all-PASS。

### v1.28-2 dogfood-nextjs-webrtc-video-app (Issue #978)

Next.js 15 App Router + mediasoup SFU + coturn TURN server (testcontainers) + WebRTC video/audio + P2P + simulcast + ICE restart。 realtime video call room + track add/remove + network flap 経由の reconnect + 36 vitest all-PASS with `KIWA_MODE=real` env-gate で coturn opt-in。

### v1.28-3 dogfood-nuxt-webtransport-stream-app (Issue #979)

Nuxt 3 + WebTransport unidirectional + bidirectional stream + HTTP/3 + Datagram + connection migration + 0-RTT resumption。 edge streaming with backpressure + network change 越しの connection migration + aioquic testcontainers fidelity harness + 30 vitest all-PASS。

### v1.28-4 dogfood-sveltekit-http3-multiplex-app (Issue #980, #982 follow-up)

SvelteKit + nginx-quic HTTP/3 + QUIC multiplex + stream priority + HPACK dynamic table + 0-RTT resumption。 multi-stream + priority scheduling + HPACK observation + 32 vitest + adversarial-review 4 finding (closeStream FIN emission + HPACK metrics teardown + 0-RTT origin isolation + priority range validation) を follow-up PR #982 で吸収。

### v1.28-5 docs 補強 (Issue #983)

`docs/tutorials/52-webrtc-video-signaling.md` (WebRTC video signaling + SFU vs P2P 選択規範) + `docs/tutorials/53-webtransport-stream.md` (WebTransport stream + HTTP/3 Datagram) + `docs/tutorials/54-http3-multiplex.md` (HTTP/3 multiplex + HPACK dynamic table + 0-RTT resumption) + `docs/concepts/webrtc-webtransport-testing.md` (8 axis SSOT + P2P vs SFU 選択規範 + 3 protocol fidelity table) + `docs/migrations/v1.27-to-v1.28.md` (additive-only migration guide) を新規追加、 v0.2 API と直接照合可能な 30 snippet-validation test を `packages/realtime/tests/docs-tutorial-v1.28.test.ts` に land、 tutorial の code snippet drift を構造的に遮断 (v1.22-1.27 pattern の 7 度目の適用、 7 milestone 連続 snippet test 化 pattern)。

## Numbers

- **6 sub-Issues resolved** (#977 / #978 / #979 / #980 / #983 / #976)
- **6 PRs merged** (v1.28-1 through v1.28-6 + follow-up #982 adversarial-review)
- **1 npm minor bump** (`@kiwa-test/realtime` v0.1.1 → v0.2.0) — kiwa runtime fixture count stays 34
- **8 axes** on advanced realtime semantics (WebRTC 4 + WebTransport 2 + HTTP/3 1 + QUIC 1)
- **3 protocol × 8 axis = 24 row fidelity grid**
- **3 dogfood apps** (Next.js + mediasoup SFU + coturn / Nuxt + WebTransport + aioquic / SvelteKit + nginx-quic HTTP/3) — 36 + 30 + 32 = **98 dogfood vitest** total
- **30 snippet-validation tests** in `packages/realtime/tests/docs-tutorial-v1.28.test.ts`

## 17-milestone streak

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → v1.27 (Mutation testing sweep) → **v1.28 (Realtime 深化 II)**。 v1.11 以降全 milestone で 6 sub-Issue 完遂維持。

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

feedback welcome。

## 参照

- Repo ... https://github.com/cardene777/kiwa
- Docs ... https://cardene777.github.io/kiwa/
- Roadmap ... https://github.com/cardene777/kiwa#roadmap
- v1.28 parent Issue ... https://github.com/cardene777/kiwa/issues/970
- WebRTC / WebTransport testing SSOT ... https://cardene777.github.io/kiwa/concepts/webrtc-webtransport-testing
