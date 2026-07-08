# kiwa v1.45 released — Realtime III deepening + pair 2 depth-3 achievement (3rd example)

## Summary

kiwa v1.45 is out. **Pair 2 (Realtime) achieves 3-stage extension** (v1.13 v0.1 base → v1.28 v0.2 WebRTC/WebTransport/HTTP/3/QUIC → v1.45 v0.3 MoQ/WebCodecs/AI-media). Third pair to reach depth 3 after Search (v1.36) + Auth (v1.44).

## What's new

### `@kiwa/realtime` v0.3.0

- **moq-fetch** — MoQT track announce + subscribe + object delivery
- **moq-datagram-media** — partial reliability + priority + FEC recovery
- **webcodecs-encoder** — VideoEncoder / AudioEncoder direct API + hardware acceleration
- **webcodecs-decoder** — reorder buffer + drop policy
- **simulcast-svc** — Simulcast + SVC (L1T1 → L3T3) + adaptive bitrate
- **voice-streaming** — LLM voice streaming (OpenAI Realtime + Anthropic voice pattern)
- **whisper-streaming** — Whisper streaming ASR + partial + VAD
- **realtime-ai-inference** — per-frame prediction + latency budget

### 3 new dogfood apps

- `examples/dogfood-realtime-moq-webcodecs-app` — 60 tests. MoQ + WebCodecs encoder + Simulcast/SVC.
- `examples/dogfood-realtime-voice-streaming-app` — 60 tests. voice + Whisper + inference.
- `examples/dogfood-realtime-svc-adaptive-app` — 60 tests. SVC + decoder + MoQ datagram.

### 3 new tutorials

- **[Tutorial 100 — MoQ + WebCodecs](https://cardene777.github.io/kiwa/tutorials/100-moq-webcodecs)**
- **[Tutorial 101 — Voice streaming](https://cardene777.github.io/kiwa/tutorials/101-voice-streaming)**
- **[Tutorial 102 — SVC adaptive](https://cardene777.github.io/kiwa/tutorials/102-svc-adaptive)**

### 23-milestone consecutive snippet validation streak

v1.23 → v1.45 = 23 milestones with tutorial code snippet validation tests.

### 縦深化 pair grid

12 pairs on record. Pair 1 (Auth) + Pair 2 (Realtime) + Pair 8 (Search) at depth 3.

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

## Install

```bash
pnpm add -D @kiwa/realtime@^0.3
```

## Migration guide

[v1.44 → v1.45](https://cardene777.github.io/kiwa/migrations/v1.44-to-v1.45)
