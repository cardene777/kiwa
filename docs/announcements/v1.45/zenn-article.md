# kiwa v1.45 リリース — Realtime III 深化 milestone + 縦深化 pair 第 2 pair 3 段拡張達成 (3 例目 record)

## 概要

kiwa v1.45 をリリースしました。 **縦深化 pair 第 2 pair (Realtime) 3 段拡張達成** — v1.13 v0.1 (base) → v1.28 v0.2 (WebRTC / WebTransport / HTTP/3 / QUIC) → v1.45 v0.3 (MoQ / WebCodecs / AI-media) の 3 段構造、 pair 第 8 Search + pair 第 1 Auth に続く **3 例目 pair 深度 3 段記録**。

## 何が変わったか

### `@kiwa/realtime` v0.3.0 (v0.2.0 → v0.3.0 minor bump)

8 個の advanced III axis を追加しました。

- **moq-fetch** — MoQT (draft-ietf-moq-transport) track announce + subscribe + object delivery
- **moq-datagram-media** — partial reliability + Forward Error Correction (FEC) recovery + priority
- **webcodecs-encoder** — VideoEncoder / AudioEncoder direct API + hardware acceleration hints
- **webcodecs-decoder** — reorder buffer + drop policy + key/delta frame handling
- **simulcast-svc** — Simulcast + Scalable Video Coding (L1T1 → L3T3) + adaptive bitrate
- **voice-streaming** — LLM voice streaming (OpenAI Realtime API + Anthropic voice)
- **whisper-streaming** — Whisper streaming ASR + partial transcript + Voice Activity Detection
- **realtime-ai-inference** — per-frame prediction + latency budget enforcement

3 新 protocol (MoQ / WebCodecs / AI-media) 追加。

### 3 dogfood app を新規追加

- `dogfood-realtime-moq-webcodecs-app` — 60 tests。 MoQ + WebCodecs encoder + Simulcast/SVC。
- `dogfood-realtime-voice-streaming-app` — 60 tests。 voice + Whisper + AI inference。
- `dogfood-realtime-svc-adaptive-app` — 60 tests。 SVC + WebCodecs decoder + MoQ datagram。

### 3 tutorial を新規追加

- **[Tutorial 100 — MoQ + WebCodecs](https://cardene777.github.io/kiwa/tutorials/100-moq-webcodecs)**
- **[Tutorial 101 — Voice streaming](https://cardene777.github.io/kiwa/tutorials/101-voice-streaming)**
- **[Tutorial 102 — SVC adaptive](https://cardene777.github.io/kiwa/tutorials/102-svc-adaptive)**

## 23 milestone 連続 snippet validation streak 達成

v1.23 → v1.45 で 23 milestone 連続。

## 縦深化 pair pattern grid

12 pair が記録されています。 **Pair 1 + Pair 2 + Pair 8 が深度 3**。

| Pair | Domain | Path | Depth |
|---|---|---|---|
| 1 | Auth | v1.21→v1.22→v1.44 | 3 |
| **2** | **Realtime** | **v1.13→v1.28→v1.45** | **3** |
| 3 | Streaming | v1.20→v1.31 | 2 |
| 4 | Database | v1.14→v1.32 | 2 |
| 5 | Payment | v1.14→v1.19→v1.33→v1.41 | 4 |
| 6 | Frontend | v1.16→v1.34 | 2 |
| 7 | Observability | v1.14→v1.17→v1.35→v1.42 | 4 |
| 8 | Search | v1.14→v1.15→v1.36 | 3 |
| 9 | Security | v1.37→v1.39 | 2 |
| 10 | AI/LLM | v1.12→v1.15→v1.38→v1.40 | 4 |
| 11 | Security base | v1.37 | 1 |
| 12 | Edge / Serverless | v1.43 | 1 |

## インストール

```bash
pnpm add -D @kiwa/realtime@^0.3
```

## Migration guide

[v1.44 → v1.45 migration guide](https://cardene777.github.io/kiwa/migrations/v1.44-to-v1.45)

## 次に何が来るか

v1.45 で 3 例目 pair 深度 3 段記録達成、 5-milestone new-base cadence + 中間 milestone での既存 pair 深化 の 2 段組み rhythm 定着継続。 次候補 = Streaming III / Database III / Frontend III / Security III (残 4 pair-2 candidate)。 次回 new base = v1.48 前後。
