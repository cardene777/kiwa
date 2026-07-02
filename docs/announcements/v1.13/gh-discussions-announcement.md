# 🌱 kiwa v1.13 — Realtime 縦軸 + perf harness (`@kiwa-test/realtime` v0.1 + `@kiwa-test/perf-harness` v0.1 + dogfood 3 app + docs 3 pillars + gh-pages 更新、 7 sub 全 resolved)

The v1.13 milestone (**7/7 GitHub Issues resolved**) just landed. v1.11 established the release-gate SSOT. v1.12 extended it to non-determinism (AI-LLM cost / latency / token / accuracy). v1.13 absorbs the **second axis of non-triviality — time**. Realtime providers push events over time; clients may be offline while pushes keep coming; order matters; buffers overflow. v1.13 lands a unified mock harness across Supabase Realtime + Ably + Pusher + Socket.io / SSE, wires 3 dogfood apps around it, and introduces `docs/concepts/realtime-testing.md` as the time-axis SSOT.

## 1. `@kiwa-test/perf-harness` v0.1 — 5 target generic perf harness (v1.13-1)

Feeds the 11-axis release gate's `perf.p95Ms` axis with p50 / p95 / p99 measurements + regression detection + baseline persistence + `/kiwa-perf` skill. 5 targets — `bench.request` / `bench.function` / `bench.stream` / `bench.batch` / `bench.worker`.

```ts
import { bench, evaluateBaseline } from '@kiwa-test/perf-harness';

const result = await bench.function({
  name: 'add-1',
  fn: () => 1 + 1,
  iterations: 10_000,
});
console.log(result); // { p50: 0.02, p95: 0.05, p99: 0.11 }
```

## 2. `@kiwa-test/realtime` v0.1 — 4 provider 統一 mock (v1.13-2)

One engine, 4 SDK adapters. All 5 realtime semantics covered — **presence** / **broadcast** / **postgres_changes** / **room** / **reconnect**.

- **`createSupabaseRealtimeMock`** — `channel.on('presence' | 'broadcast' | 'postgres_changes', filter, handler)` + `channel.track / untrack / send`
- **`createAblyMock`** — `channels.get / subscribe / presence.subscribe / history rewind`
- **`createPusherMock`** — `subscribeChannel / bind / trigger` + `presence-*` channel members
- **`createSocketioMock`** — `io(namespace).join(room).emit / on` + `io.of(namespace).to(room).emit`

The 4 adapters sit on top of one engine (`packages/realtime/src/engine.ts`) that owns a **discrete + synchronous virtual timeline** — subscribe, and events fire on a per-channel `delay` schedule you declared upfront. Because there is no real socket, tests can assert on the exact number of events delivered per channel, the exact ordering across channels, the exact drop count from backpressure, and the exact number of reconnect attempts — signals that real sockets under jitter never surface cleanly.

## 3. Dogfood app 3 種 — real vs mock, chat / cursor / notification (v1.13-3 / -4 / -5)

Every realtime use-case pattern gets an example app that runs against **both the real provider and the kiwa mock**. Trace differences feed the fidelity axis of the 7-axis common branch (realtime providers do **not** activate the AI-LLM 11-axis branch — the `provider` prefix `@kiwa-test/realtime` does not match `@kiwa-test/ai-`).

- **`examples/dogfood-supabase-realtime-chat/`** (v1.13-3) — Supabase Realtime chat + presence + typing indicator + 500 ms typing debounce
- **`examples/dogfood-ably-collab-cursor/`** (v1.13-4) — Ably shared cursor + 60 fps client-side throttle + history rewind for late joiners
- **`examples/dogfood-socketio-notification/`** (v1.13-5) — Socket.io / SSE per-room push + reconnect + pending replay + bounded backpressure queue (drop counts observable)

All three follow the same **provider-neutral adapter interface + `KIWA_MODE=real|mock` split + trace-diffing fidelity harness** template that v1.11 established and v1.12 confirmed.

Real-world release-gate discovery — running the Supabase Realtime dogfood without `SUPABASE_URL` + `SUPABASE_ANON_KEY` correctly records 4 divergences (`joinRoom` / `sendMessage` / `getPresence` / `sendTyping`) as `BEHAVIORAL_DIVERGENCE`, so the mock is not spuriously credited with parity it cannot demonstrate. The gate stays honest even in local dev.

## 4. Docs 補強 — tutorials + migration + concept doc (v1.13-6)

- **[`docs/tutorials/09-supabase-realtime-chat.md`](https://github.com/cardene777/kiwa/blob/main/docs/tutorials/09-supabase-realtime-chat.md)** — Supabase Realtime chat + presence + 500 ms typing debounce
- **[`docs/tutorials/10-ably-collab-cursor.md`](https://github.com/cardene777/kiwa/blob/main/docs/tutorials/10-ably-collab-cursor.md)** — Ably shared cursor + 60 fps throttle + history rewind
- **[`docs/tutorials/11-socketio-notification.md`](https://github.com/cardene777/kiwa/blob/main/docs/tutorials/11-socketio-notification.md)** — Socket.io notification + reconnect + pending replay + backpressure
- **[`docs/migrations/v1.12-to-v1.13.md`](https://github.com/cardene777/kiwa/blob/main/docs/migrations/v1.12-to-v1.13.md)** — additive-only migration, no release-gate axis change
- **[`docs/concepts/realtime-testing.md`](https://github.com/cardene777/kiwa/blob/main/docs/concepts/realtime-testing.md)** — time-axis mock SSOT (why v1.11 + v1.12 scalar axes are not enough for sequences, how 5 realtime axes translate into fidelity + perf, why the mock timeline is discrete + synchronous on purpose)

## 5. VitePress + GitHub Pages — sidebar update, no skeleton change (v1.13-7)

The v1.11-6 VitePress skeleton is reused unchanged. `docs/.vitepress/config.mts` gains sidebar entries for the 3 new tutorials, the concept doc, and the v1.12→v1.13 migration. `/docs-publish-kiwa` runs `pnpm docs:build` → `git worktree add ../kiwa-gh-pages gh-pages` → dist copy → push, refreshing `https://cardene777.github.io/kiwa/` without touching CI. Playwright docs E2E gains 5 new specs (tutorial 09/10/11 + concept + migration v1.12→v1.13) alongside the existing v1.11 + v1.12 spec, and a new `pnpm test:docs-e2e` script wires them into one command.

## Migration

v1.12 users can adopt v1.13 without touching existing tests. Add the new packages when you want to test realtime or measure perf:

```bash
pnpm add -D @kiwa-test/realtime @kiwa-test/perf-harness
```

The release gate does not gain new axes in v1.13 — realtime providers land on the 7-axis common branch. The `provider` prefix `@kiwa-test/realtime` does **not** match `@kiwa-test/ai-`, so the 11-axis branch stays exclusive to AI-LLM providers.

Full migration guide: [v1.12 → v1.13](https://github.com/cardene777/kiwa/blob/main/docs/migrations/v1.12-to-v1.13.md).

Sub-Issue AC verification: [#709](https://github.com/cardene777/kiwa/issues/709) (parent) → [#707](https://github.com/cardene777/kiwa/issues/707) [#710](https://github.com/cardene777/kiwa/issues/710) [#711](https://github.com/cardene777/kiwa/issues/711) [#712](https://github.com/cardene777/kiwa/issues/712) [#713](https://github.com/cardene777/kiwa/issues/713) [#714](https://github.com/cardene777/kiwa/issues/714) [#715](https://github.com/cardene777/kiwa/issues/715).

## v1.14+ candidates

v1.11 milestone parent (#680) で列挙した v1.12+ 候補のうち v1.12 / v1.13 で採用しなかったもの + v1.12 announcement で追加した AI-LLM 深化候補。

- Storybook integration (component test 隙間、 v2.0 pull-forward 候補)
- Dragonfly (2025 新興 Redis 互換 cache、 eco system 熟成待ち)
- Reth (Rust Ethereum execution client、 dApp test 需要が育つ)
- Go Iris + Chi (framework 縦深化続き)
- Payment 系 (Stripe / Paddle / Lemon Squeezy webhook mock)
- Search 系 (Meilisearch / Algolia / Typesense)
- Observability 深堀り (OpenTelemetry / Datadog / Sentry)
- AI-LLM 深化 (multimodal vision / audio + MCP tool + agent orchestration)

Happy testing! 🌱
