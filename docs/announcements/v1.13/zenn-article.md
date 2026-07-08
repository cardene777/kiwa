---
title: "kiwa v1.13 リリース — Realtime 縦軸 (@kiwa/realtime + @kiwa/perf-harness + dogfood 3 app + 時間軸 mock SSOT)"
emoji: "🌱"
type: "tech"
topics: ["oss", "testing", "supabase", "ably", "realtime"]
published: false
---

## TL;DR

kiwa v1.13 milestone (**7/7 GitHub Issues resolved**) を land した。 v1.11 で「release 品質を数値で判断可能にする」 縦軸 (5 軸統一 harness + release gate SSOT + dogfood 3 app + docs 3 pillars) を確立、 v1.12 で「非決定性 (AI-LLM cost / latency / token / accuracy) を吸収」 に伸ばした。 v1.13 は同じ縦軸を **時間軸 (Realtime、 sequence の失敗)** に伸ばす。

`@kiwa/realtime` v0.1 で Supabase Realtime + Ably + Pusher + Socket.io/SSE の 4 provider を 1 mock engine で統一、 5 semantics (presence / broadcast / postgres_changes / room / reconnect) を SSOT 化し、 dogfood 3 app (chat / cursor / notification) を real vs mock で並べる。 `@kiwa/perf-harness` v0.1 で 5 target 汎用性能測定 (p50 / p95 / p99 + regression) を 11 軸 release gate の `perf.p95Ms` 軸に feed。 `docs/concepts/realtime-testing.md` で時間軸 mock を第一級 concept として言語化する。

- 親 Issue ... [#709](https://github.com/cardene777/kiwa/issues/709)
- 7 sub-Issue ... [#707](https://github.com/cardene777/kiwa/issues/707) (v1.13-1 perf-harness、 単発 land 済) / [#710](https://github.com/cardene777/kiwa/issues/710) - [#715](https://github.com/cardene777/kiwa/issues/715)

## 1. `@kiwa/perf-harness` v0.1 — 5 target 汎用 perf (v1.13-1)

v1.11 の release gate `perf.p95Ms` 軸は「1 測定 helper に手を入れれば十分」 な軸だが、 実運用で使うには target 別の helper が必要。 v1.13-1 は 5 target を default で提供する。

### 5 target

- `bench.request` — HTTP surface (fetch / axios / undici)
- `bench.function` — pure sync/async function
- `bench.stream` — async iterator / Web Streams
- `bench.batch` — bulk operation (DB insert / worker fanout)
- `bench.worker` — Web Worker / Node Worker RPC

各 target で `p50 / p95 / p99 / mean / min / max` を出し、 前回 baseline との回帰を `regressionRatio` で検知する。

### 11 軸 release gate との連携

`buildPerfReport({ target, samples })` が `QualityReport` を出力、 v1.11 で確立した 11 軸 (v1.12 で 11 に拡張) の `perf.p95Ms` 軸に落とす。 perf-harness は既存の release gate 判定を壊さない完全 additive。

## 2. `@kiwa/realtime` v0.1 — 4 provider 統一 mock (v1.13-2)

1 mock engine、 4 SDK 別 adapter shape。 5 semantics (presence / broadcast / postgres_changes / room / reconnect) を全 SDK で cover。

### 4 provider adapter

- `createSupabaseRealtimeMock` — `channel.on('presence' | 'broadcast' | 'postgres_changes', filter, handler)` + `channel.track / untrack / send`
- `createAblyMock` — `channels.get / subscribe / presence.subscribe / history rewind`
- `createPusherMock` — `subscribeChannel / bind / trigger` + `presence-*` channel members
- `createSocketioMock` — `io(namespace).join(room).emit / on` + `io.of(namespace).to(room).emit`

### なぜ「discrete + synchronous timeline」 か

real socket は jitter + batching + Nagle micro-delay を内包するため、 test で「channel A の event 3 番目が channel B の event 2 番目より先」 のような ordering assertion を書くと flaky になる。 v1.13 mock は event N が subscribe 後 `sum(delay[0..N])` ms で必ず fire する discrete timeline を採用、 real socket の観測不能な内部状態 (drop count / reconnect attempt / pending queue) を第一級 metric として公開する。

fidelity harness は real の trace と mock の trace を「同じ scenario 定義」 で並べて実行、 event 列 / order / timing の drift を計測する。 v1.12 で「意図的 deterministic mock + real drift 実測」 を打ち出したのと同じ思想を時間軸に伸ばした形。

## 3. Dogfood 3 app (v1.13-3 / -4 / -5)

chat / cursor / notification の 3 主要 use case を、 real vs mock の 2 mode で走らせて trace 差分から fidelity を実測。

### 3 app の役割分担

```
examples/
├── dogfood-supabase-realtime-chat/    # broadcast + presence + typing debounce (Next.js + Supabase Realtime)
├── dogfood-ably-collab-cursor/        # shared cursor + 60 fps throttle + history rewind (Next.js + Ably)
└── dogfood-socketio-notification/     # per-room push + reconnect + pending replay + backpressure (Express + Socket.io/SSE)
```

v1.11 / v1.12 dogfood template と同じ 3 layer 構造。

```
src/
├── adapters/
│   ├── interface.ts   (provider-neutral trace-recording shape)
│   ├── mock.ts        (kiwa mock adapter)
│   └── real.ts        (real provider + graceful skip)
└── flows/
    ├── <domain>-flows.ts
    └── fidelity.ts     (trace diff + quality-metrics 呼出)
```

### 実運用検証

`SUPABASE_URL` / `SUPABASE_ANON_KEY` なしで Supabase Realtime dogfood を走らせると、 real adapter が `SUPABASE_ENV_MISSING` を返して 4 op (`joinRoom` / `sendMessage` / `getPresence` / `sendTyping`) 全てで divergence を記録、 mock adapter に不当な parity credit を与えない。 local dev で本番 API key を積まないままの走行でも gate が honest に働くことを実測データで実証。

realtime provider は AI-LLM 分岐 (`@kiwa/ai-` prefix) に該当しないため 7 軸 common branch で判定される。 11 軸 gate 全体は unchanged、 realtime 特有の追加 axis はなし。

## 4. Docs 補強 (v1.13-6)

### tutorial 3 本 (5 セクション統一テンプレ、 v1.11 / v1.12 と同構造)

- 09: Supabase Realtime chat + presence + typing debounce
- 10: Ably shared cursor + 60 fps throttle + history rewind
- 11: Socket.io notification + reconnect + pending replay + backpressure

### migration guide 1 本

- v1.12 → v1.13 (additive-only、 diff 形式、 verification コマンド付、 `@kiwa/realtime` + `@kiwa/perf-harness` add 1 行 + realtime provider は 7 軸 common branch を維持)

### concept doc 1 本

- `docs/concepts/realtime-testing.md` — 時間軸 mock SSOT

`docs/concepts/realtime-testing.md` は v1.13 の思想の芯を言語化する doc。 「realtime provider は server push + client offline + timed order + buffer overflow の 4 経路で scalar test を破る」 「v1.11 + v1.12 の 11 scalar 軸では presence sync 中の event 順序逆転 / offline 中の silent drop / room 間 cross-leak / pending queue flush 失敗の 5 種を捕まえられない」 「解は mock timeline を discrete + synchronous にして sequence を丸ごと観測 + real drift を per-axis (order / timing / drop / reconnect / backpressure) に落とす」 「同じ report を 7 軸 common branch (`isAiLlmProvider` = false) に落として既存 gate を壊さない」 の 5 段構造。

## 5. VitePress publish (v1.13-7)

v1.11-6 で land した VitePress skeleton (`docs/.vitepress/config.mts`) は unchanged。 sidebar に新 tutorial 3 本 + concept doc 1 本 + migration v1.12→v1.13 を追記するのみ。

```bash
# generate → build → publish の 3 step (v1.11 / v1.12 と同じ)
claude /docs-generate       # typedoc + cargo doc + forge doc
pnpm docs:build             # VitePress build → docs/.vitepress/dist/
claude /docs-publish-kiwa   # gh-pages branch push
```

Playwright docs E2E (`tests/docs-site-e2e/`) は既存 canonical + v1.12 spec に加えて tutorial 09/10/11 + concept + migration v1.12→v1.13 の 5 spec を追加、 `pnpm test:docs-e2e` script を新設。 build 後の verification に組み込み。 CI 全面禁止規約 (`rules/git-workflow.md`) 下で GitHub Actions 一切使わず、 `gh-pages` branch push だけで `https://cardene777.github.io/kiwa/` を更新。

## Migration

v1.12 user は zero-migration。 既存 test file はそのまま動く。 v1.13 追加は全て opt-in、 realtime provider を使わない限り `@kiwa/realtime` は不要、 perf 測定を使わない限り `@kiwa/perf-harness` は不要。

```bash
pnpm add -D @kiwa/realtime @kiwa/perf-harness
```

release gate は v1.13 で軸追加なし、 realtime provider は 7 軸 common branch を維持。 詳細 ... [v1.12 → v1.13 migration guide](https://github.com/cardene777/kiwa/blob/main/docs/migrations/v1.12-to-v1.13.md)。

## v1.14+ 候補

v1.11 milestone parent (#680) で列挙した候補のうち v1.12 / v1.13 で採用しなかったもの + v1.12 announcement で追加した AI-LLM 深化候補。

- Storybook integration (component test 隙間、 v2.0 pull-forward 候補)
- Dragonfly (2025 新興 Redis 互換 cache、 eco system 熟成待ち)
- Reth (Rust Ethereum execution client、 dApp test 需要が育つ)
- Go Iris + Chi (framework 縦深化続き)
- Payment 系 (Stripe / Paddle / Lemon Squeezy webhook mock)
- Search 系 (Meilisearch / Algolia / Typesense)
- Observability 深堀り (OpenTelemetry / Datadog / Sentry mock)
- AI-LLM 深化 (multimodal vision / audio + MCP tool + agent orchestration)

## 参考

- v1.13 親 Issue ... https://github.com/cardene777/kiwa/issues/709
- v1.12 milestone 完遂 (11 軸 release gate + AI-LLM 4 SDK 統一 mock の source of truth)
- @kiwa/realtime ... `packages/realtime/`
- @kiwa/perf-harness ... `packages/perf-harness/`
- dogfood 3 app ... `examples/dogfood-{supabase-realtime-chat,ably-collab-cursor,socketio-notification}/`
- 4 provider 選定理由 ... Supabase Realtime + Ably = enterprise 2 大 provider、 Pusher = SaaS 標準、 Socket.io/SSE = 直呼び 2 種で自前実装 cover、 4 provider で realtime SaaS 実装の大半を cover
- 5 semantics 選定理由 ... presence (誰がいるか) / broadcast (即時全 client 配信) / postgres_changes (DB 同期) / room (namespace 分離) / reconnect (backpressure + retry)、 5 つで realtime の mock 難所を網羅
- 時間軸 mock SSOT ... `docs/concepts/realtime-testing.md`
