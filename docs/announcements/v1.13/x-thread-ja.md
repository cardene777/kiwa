1/ 🌱 kiwa v1.13 リリース — Realtime 縦軸 + perf harness。 7/7 sub-issues 全 resolved。

v1.12 の「非決定性 (AI-LLM) を release gate で吸収」 縦軸に対し、 v1.13 は「時間軸 (Realtime) を統一 mock で吸収」 縦軸に伸ばす思想シフト。

v1.11 + v1.12 の 11 軸は全て scalar。 realtime failure は sequence。 v1.13 は sequence を第一級 mock 対象として吸収する。

2/ @kiwa/perf-harness v0.1 — 5 target 汎用 perf 測定。

bench.request / bench.function / bench.stream / bench.batch / bench.worker で p50 / p95 / p99 + regression 検知 + baseline 比較。 11 軸 release gate の perf.p95Ms 軸に feed。

3/ @kiwa/realtime v0.1 — 4 provider 統一 mock。

createSupabaseRealtimeMock — channel.on('presence' | 'broadcast' | 'postgres_changes', filter, handler) + track / send。
createAblyMock — channels.get / subscribe / presence.subscribe / history rewind。
createPusherMock — subscribeChannel / bind / presence-* member。
createSocketioMock — io(namespace).join(room).emit + io.of(namespace).to(room).emit。

1 engine 4 adapter。 discrete + synchronous virtual timeline — event N は subscribe 後 sum(delay[0..N]) ms で必ず fire。

4/ なぜ real socket を wrap しないか。

real socket は jitter で観測できない — channel ごとの event delivery 数、 channel 間の ordering、 backpressure による drop 数、 reconnect 回数の 4 つは real では厳密に出ない。 mock は timeline を所有するので出せる。

fidelity harness が real の mock からの drift を軸別に計測する。

5/ Dogfood 3 app — chat / cursor / notification の 3 主要 use case を real vs mock で並べる。

examples/dogfood-supabase-realtime-chat/ (broadcast + presence + typing debounce)。
examples/dogfood-ably-collab-cursor/ (60 fps client throttle + history rewind)。
examples/dogfood-socketio-notification/ (reconnect + pending replay + bounded backpressure queue)。

v1.11 / v1.12 と同じ「provider-neutral interface + KIWA_MODE=real|mock」 template を再利用。

6/ 実運用検証 — SUPABASE_URL / SUPABASE_ANON_KEY なしで Supabase Realtime dogfood を走らせると、 joinRoom / sendMessage / getPresence / sendTyping の 4 op で BEHAVIORAL_DIVERGENCE を記録する。 mock に不当な parity credit を与えない。 local dev でも gate が honest に働く。

7/ 時間軸を第一級 concept として言語化。

docs/concepts/realtime-testing.md で明文化。 v1.11 + v1.12 の 11 scalar 軸では捕まえられない失敗 — presence sync 中の event 順序逆転、 reconnect 後の presence roll-up member 消失、 offline 中の 1000 event silent drop、 room 間 payload cross-leak、 reconnect したが pending queue が flush されない ... を sequence 単位で mock + fidelity harness が測る。

8/ Docs 3 pillars 更新 — 新 tutorial 3 本 (Supabase Realtime chat / Ably shared cursor / Socket.io notification)、 migration v1.12→v1.13 (additive-only、 release gate 軸追加なし)、 時間軸 mock concept doc。

VitePress skeleton は v1.11-6 のを再利用、 sidebar 追記のみ。 /docs-publish-kiwa (CI 使わず gh-pages branch push) で https://cardene777.github.io/kiwa/ を更新。 Playwright docs E2E に 5 spec 追加 + pnpm test:docs-e2e script 新設。

9/ Roadmap — https://github.com/cardene777/kiwa/issues/709

v1.14+ 候補 — Storybook、 Dragonfly、 Reth、 Go Iris + Chi、 Payment (Stripe / Paddle / Lemon Squeezy)、 Search (Meilisearch / Algolia / Typesense)、 Observability 深堀り (OTel / Datadog / Sentry)、 AI-LLM 深化 (multimodal / MCP / agent orchestration)。

release cadence 追いたい人は @cardene777 まで。
