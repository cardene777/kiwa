# Realtime advanced III testing — v0.3 8 axis SSOT

## What this covers

`@kiwa/realtime` v0.3 layers 8 advanced III axes on top of the v0.2 base (WebRTC + WebTransport + HTTP/3 + QUIC 8 axis)。 v0.3 introduces 3 new protocols (MoQ / WebCodecs / AI-media) and 8 axes for Media over QUIC delivery + WebCodecs direct API + LLM voice / Whisper ASR / realtime AI inference。

## Pair 第 2 pair 3 段拡張達成 (3 例目 record)

v1.45 achieves the **2nd 縦深化 pair 3 段拡張** (Realtime base → v1.28 II → v1.45 III)。 pair 第 8 Search (v1.36) + pair 第 1 Auth (v1.44) に続く **3 例目 pair 深度 3 段記録**、 3 段拡張 pattern の 3 例安定化を実証。

## The 8 v0.3 advanced III axes

### moq-fetch axis

`createMoqFetchMock()` + `announceTrack` + `subscribeTrack` + `sendObject` + `receiveObject`。 MoQT (draft-ietf-moq-transport) 仕様の pub/sub media transport pattern。

### moq-datagram-media axis

`createMoqDatagramMediaMock()` + `sendDatagram` + `dropDatagram` + `setPriority` + `recoverFec`。 partial reliability + Forward Error Correction pattern。

### webcodecs-encoder axis

`createWebCodecsEncoderMock()` + `configure` + `encodeFrame` + `forceKeyframe` + `reportHardwareUsed`。 VideoEncoder / AudioEncoder direct API + hardware acceleration hints。

### webcodecs-decoder axis

`createWebCodecsDecoderMock()` + `configure` + `decodeFrame` + `reorderFrame` + `dropFrame`。 VideoDecoder / AudioDecoder + reorder buffer + drop policy。

### simulcast-svc axis

`createSimulcastSvcMock()` + `addSimulcastLayer` + `selectSvcLayer` + `adaptBitrate` + `dropLayer`。 Simulcast + Scalable Video Coding (L1T1 → L3T3) + adaptive bitrate。

### voice-streaming axis

`createVoiceStreamingMock()` + `openSession` + `sendAudioChunk` + `receiveResponseChunk` + `completeTurn`。 OpenAI Realtime API + Anthropic voice pattern。

### whisper-streaming axis

`createWhisperStreamingMock()` + `sendAudioChunk` + `emitPartialTranscript` + `emitFinalTranscript` + `triggerVad`。 Whisper streaming ASR + partial transcript + Voice Activity Detection。

### realtime-ai-inference axis

`createRealtimeAiInferenceMock()` + `sendRequest` + `receiveResponse` + `reportBudget` + `dropRequest`。 per-frame prediction + latency budget enforcement + drop policy。

## 6-protocol × 8-axis fidelity grid

Realtime v0.3 は v0.2 + v0.3 合計 16 axis を 6 protocol (webrtc / webtransport / http3-quic / moqt / webcodecs / ai-media) に分割、 4 provider (Supabase / Ably / Pusher / Socket.io) × 16 axis = 64 cell の provider grid + 6 protocol grouping。

## Dogfood app real-driver env-gate

3 dogfood apps ship in v1.45。

- `dogfood-realtime-moq-webcodecs-app` — moq + webcodecs-encoder + simulcast-svc。 `KIWA_MODE=real` + `REALTIME_MEDIA_STACK_READY=1` + `KIWA_REALTIME_MEDIA_URL`。
- `dogfood-realtime-voice-streaming-app` — voice + whisper + ai-inference。 `KIWA_MODE=real` + `REALTIME_AI_STACK_READY=1` + `KIWA_REALTIME_AI_URL`。
- `dogfood-realtime-svc-adaptive-app` — svc + decoder + moq-datagram。 `KIWA_MODE=real` + `REALTIME_ADAPTIVE_STACK_READY=1` + `KIWA_REALTIME_ADAPTIVE_URL`。

## Related concepts

- `webrtc-webtransport-testing.md` (v1.28 pair 2 base 深化 II の 8 axis)
- `realtime-testing.md` (v1.13 realtime v0.1 5 base semantics)
- `auth-advanced-III-testing.md` (v1.44 pair 1 depth-3 achievement)
- `edge-serverless-advanced-testing.md` (v1.43 pair 12 new base pair)
