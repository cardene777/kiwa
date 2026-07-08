# kiwa v1.45 x-thread (日本語)

## Tweet 1 — hook

kiwa v1.45 リリース — Realtime III 深化 が land.

@kiwa/realtime v0.2.0 → v0.3.0 minor bump. 3 新 protocol (MoQ + WebCodecs + AI-media) 上に advanced III 8 axis を追加.

縦深化 pair pattern 第 2 pair (Realtime) **3 段拡張達成** (v1.13 v0.1 → v1.28 v0.2 → v1.45 v0.3)、 pair 第 8 Search + pair 第 1 Auth に続く **3 例目 pair 深度 3 段記録**.

## Tweet 2 — 8 axis Realtime advanced III semantics

MoQ fetch (track announce + subscribe + object delivery) / MoQ datagram media (partial reliability + FEC recovery) / WebCodecs encoder (VideoEncoder / AudioEncoder direct API + hardware acceleration) / WebCodecs decoder (reorder buffer + drop policy) / Simulcast + SVC (L1T1 → L3T3 layer + adaptive bitrate) / LLM voice streaming (OpenAI Realtime API + Anthropic voice) / Whisper streaming ASR (partial transcript + VAD) / Realtime AI inference (per-frame prediction + latency budget).

## Tweet 3 — pair 深度 3 段記録 3 例目達成

Realtime v1.13 (base) → v1.28 (WebRTC + WebTransport + HTTP/3 + QUIC) → **v1.45 (MoQ + WebCodecs + AI-media)** の 3 段構造。 pair 第 8 Search + pair 第 1 Auth に続く 3 例目、 3 段拡張 pattern の 3 例安定化を実証。 5-milestone new-base cadence (v1.43 Edge / Serverless) + 中間 milestone での既存 pair 深化 の 2 段組み rhythm 定着継続.

## Tweet 4 — snippet streak + npm publish

**23 milestone 連続 snippet validation streak** (v1.23-v1.45) 達成。

`pnpm add -D @kiwa/realtime` で v0.3.0 が入る. breaking change なし. migration guide は https://cardene777.github.io/kiwa/migrations/v1.44-to-v1.45

sub-milestone 6 完遂 (v1.45-1 realtime v0.3 + 8 axis + 200 test / v1.45-2 moq-webcodecs dogfood + 60 test / v1.45-3 voice-streaming dogfood + 60 test / v1.45-4 svc-adaptive dogfood + 60 test / v1.45-5 docs + 209 test = 23 milestone snippet streak / v1.45-6 publish).

#kiwa #realtime #moq #webcodecs #whisper #openai-realtime #testing #vitest
