# @kiwa-test/realtime

## 0.2.0

### Minor Changes

- 🆕 feat(v1.28-1): `@kiwa-test/realtime` v0.2.0 — advanced-transport semantics for 3 protocols × 8 axes plus a real-driver env-gate for the 4 base providers.

  GH #971 — extends the v1.13 base (5 semantics, 4 providers) with a new low-layer transport surface for WebRTC / WebTransport / HTTP/3 / QUIC dogfood apps, keeps the mock-default posture, and lifts the 4 providers to real-vs-mock parity via `KIWA_MODE=real`.

  ## What's added

  ### 8 advanced-transport axes (`src/semantics/*.ts`)

  - `webrtc-signaling` — offer / answer + SDP negotiation + ICE candidate exchange + renegotiation
  - `webrtc-data-channel` — ordered / unordered + `maxRetransmits` + `binaryType`, with deterministic drop simulation
  - `webrtc-track` — `getUserMedia` mock + `MediaStream` + track add / remove + simulcast layers (low / med / high)
  - `webrtc-ice` — gathering / checking / connected state machine + TURN relay + trickle ICE
  - `webtransport-uni` — unidirectional stream + Datagram + reset stream (with error code)
  - `webtransport-bi` — bidirectional stream + flow control window + backpressure + close
  - `http3-push` — server push + prioritization (urgency 0-7 + incremental) + `push_promise` + cancellation
  - `quic-multiplex` — stream multiplex + priority-sorted active list + HPACK dynamic table + 0-RTT resume

  Each axis exposes an event stream via `mock.onEvent(handler)`, a metrics counter (`eventsEmitted / streamsOpened / streamsClosed / streamsReset / backpressureCount` + axis-specific `custom`), and a `reset()` boundary.

  ### 24-row grid harness (`src/semantics-fidelity.ts`)

  - `SEMANTICS_GRID` — 3 protocol × 8 axis SSOT with 8 applicable and 16 placeholder rows
  - `measureSemanticsAxis` — collect events + metrics for one axis with timeout
  - `measureSemanticsGrid` — run all 8 applicable axes in a single pass, return 24-row `SemanticsFidelityRow[]`

  ### Real driver env-gate (`src/real-driver.ts`)

  - `resolveRealtimeDriver({ provider, requiredKeys, createReal, createMock })` — returns real driver only when `KIWA_MODE=real` and all provider secrets are set; otherwise falls back to mock with `missingKeys` + `reason` diagnostics
  - `resolveRealtimeDriverByProvider(provider, createReal, createMock)` — shorthand using `REAL_DRIVER_REQUIRED_KEYS` SSOT (Supabase / Ably / Pusher / Socket.io)

  ### Tests

  - `tests/semantics/` — 48 axis tests (6 per axis × 8 axis) + 6 grid tests + 6 real-driver tests = 60 tests, all deterministic

## 0.1.1

### Patch Changes

- bd40f20: 🆕 feat(v1.13-2): `@kiwa-test/realtime` v0.1.0 — 4 provider unified mock harness (Supabase Realtime + Ably + Pusher + Socket.io/SSE)

  v1.13 milestone (Issue #710、 親 #709) — Realtime 系 4 provider 統一 mock を新設し、 presence / broadcast / postgres_changes / room / reconnect の 5 semantics を SSOT として提供する。

  ## What's added

  ### 5 semantics core (`src/types.ts`, `src/engine.ts`)

  - `ConnectionState` の 5 state machine (`disconnected → connecting → connected → reconnecting → closed`)
  - `PresenceEvent` (`sync / join / leave`) と `PresenceMember` state
  - `BroadcastEvent` の per-channel FIFO ordering
  - `PostgresChangeEvent` (`INSERT / UPDATE / DELETE`) の CDC event
  - `Room` (namespace + room の 2 階層) と `ReconnectPolicy` (指数 backoff + jitter)
  - `RealtimeEngine` — 4 adapter 共通の core (channel registry / event queue / presence state / connection lifecycle / backpressure)

  ### 4 provider adapters

  - `createSupabaseRealtimeMock` — `channel.on('presence' | 'broadcast' | 'postgres_changes', filter, handler)` + `channel.track / untrack / send`
  - `createAblyMock` — `channels.get / subscribe / presence.subscribe / history rewind`
  - `createPusherMock` — `subscribeChannel / bind / trigger` + presence channel (`presence-*` prefix)
  - `createSocketioMock` — `io(namespace).join(room).emit / on` + `io.of(namespace).to(room).emit`

  ### Fidelity harness (`src/fidelity.ts`)

  - `runRealtimeFidelityCheck({ realDriver, mockDriver, scenarios })` — real vs mock で 5 semantics 各シナリオを並行実行、 event 列 / order / timing の差分を計測
  - `kindOrderMatch` + `payloadMatch` の position-aware Jaccard sequence similarity
  - `createMockCollector` — mock adapter を CollectedEvent stream に変換する minimum driver

  ### Quality-metrics adapter (`src/report.ts`)

  - `buildRealtimeReport(input): QualityReport` — realtime 実測値を AI-LLM 4 軸 (`cost / latency / token / accuracy`) にマッピング、 11 軸 release gate に統合
  - Realtime 特有の帯域 metric (event byte / 1000 event cost) を token / cost 軸に近似

  ## Test coverage

  48 tests / 88.31% line coverage (7 test files) 。 `types.ts` は re-export のみで挙動なし。

  - `engine.test.ts` (12) — subscribe / publish / presence / postgres_changes / connection lifecycle / scenario / metrics / backpressure
  - `supabase.test.ts` (7) — broadcast filter / presence track-untrack / postgres_changes filter / connection state
  - `ably.test.ts` (6) — event handler / wildcard / history rewind / presence enter-leave / connection close
  - `pusher.test.ts` (6) — bind / unbind / presence-\* channel members / member_added / member_removed / disconnect
  - `socketio.test.ts` (6) — emit/on round-trip / join-leave room / namespace `io.of().to().emit()` / connect + disconnect events / off handler
  - `fidelity.test.ts` (8) — sequence similarity edge cases / identical drivers / diverging payloads / event count diff / multi-scenario summary
  - `report.test.ts` (3) — 11-axis QualityReport 組立 / behavioralDivergences 検出 / default coverage

  ## Backward compatibility

  新規 package のため既存 breaking なし。 `@kiwa-test/quality-metrics` v0.2 の AI-LLM provider 判定 (`isAiLlmProvider`) は変更不要 — realtime 側で AI-LLM 4 軸 shape に変換して同じ 11 軸 gate を再利用する。

  Refs #710、 #709。

- Updated dependencies [797e5ea]
  - @kiwa-test/quality-metrics@0.2.0
