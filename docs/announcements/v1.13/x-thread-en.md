1/ 🌱 kiwa v1.13 shipped — Realtime 縦軸 + perf harness. 7/7 sub-issues resolved.

Focus shift from "measure release quality of AI-LLM providers" (v1.12, non-determinism axis) to "measure release quality of realtime providers" (v1.13, time axis).

v1.11 + v1.12 axes measure scalars. Realtime failures are sequences. v1.13 absorbs that.

2/ @kiwa/perf-harness v0.1 — 5 target generic perf.

bench.request / bench.function / bench.stream / bench.batch / bench.worker — p50 / p95 / p99 + regression detection + baseline persistence. Feeds the 11-axis release gate's perf.p95Ms.

3/ @kiwa/realtime v0.1 — 4 provider unified mock.

createSupabaseRealtimeMock — channel.on('presence' | 'broadcast' | 'postgres_changes', filter, handler) + track / send.
createAblyMock — channels.get / subscribe / presence.subscribe / history rewind.
createPusherMock — subscribeChannel / bind / presence-* members.
createSocketioMock — io(namespace).join(room).emit + io.of(namespace).to(room).emit.

One engine, 4 SDK shapes. Discrete + synchronous virtual timeline — event N fires exactly sum(delay[0..N]) ms after subscribe.

4/ Why not just wrap real sockets?

Real sockets under jitter never expose the numbers you actually want — the exact number of events delivered per channel, the exact ordering across channels, the exact drop count from backpressure, the exact reconnect attempts. The mock does — because it owns the timeline.

The fidelity harness measures how far real drifts from mock, per axis.

5/ Dogfood 3 apps — real vs mock across 3 canonical use cases.

examples/dogfood-supabase-realtime-chat/ (broadcast + presence + typing debounce).
examples/dogfood-ably-collab-cursor/ (60 fps client throttle + history rewind).
examples/dogfood-socketio-notification/ (reconnect + pending replay + bounded backpressure queue).

Same provider-neutral interface + KIWA_MODE=real|mock template from v1.11 / v1.12.

6/ Real-world discovery — running the Supabase Realtime dogfood without SUPABASE_URL + SUPABASE_ANON_KEY correctly records 4 behavioural divergences (joinRoom / sendMessage / getPresence / sendTyping). The gate stays honest even in local dev — no fake parity credit.

7/ Time axis as a first-class concept.

docs/concepts/realtime-testing.md names it. Why v1.11 + v1.12's 11 scalar axes cannot catch — messages arriving in wrong order under presence sync, presence roll-up losing a member after reconnect, 1k events silently dropped while offline, rooms cross-leaking payloads, reconnect happening but pending queue never flushed.

The mock records the sequence; the fidelity harness diffs it.

8/ Docs 3 pillars refreshed — 3 new tutorials (Supabase Realtime chat / Ably shared cursor / Socket.io notification), migration v1.12→v1.13 (additive-only, no gate axis change), concept doc for time-axis mocks.

VitePress site skeleton reused unchanged. Sidebar update only. https://cardene777.github.io/kiwa/ refreshed via /docs-publish-kiwa (no CI, gh-pages branch push).

9/ Full changelog — https://github.com/cardene777/kiwa/issues/709

v1.14+ candidates — Storybook, Dragonfly, Reth, Go Iris + Chi, Payment (Stripe / Paddle / Lemon Squeezy), Search (Meilisearch / Algolia / Typesense), Observability deep dive (OTel / Datadog / Sentry), AI-LLM depth (multimodal + MCP tool + agent orchestration).

Follow @cardene777 for release cadence.
