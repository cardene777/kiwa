# Perf thresholds — SSOT

## Why this file exists

The previous perf-harness rollout (v1.13-1 / v1.14-1) picked p95 thresholds by feel — `20ms` for realtime, `40ms` for AI-LLM mocks, `50ms` for dogfood adapter joins. Those numbers had no external justification, so a passing report proved nothing beyond "the mock is not catastrophically slow".

This doc pins **every** perf threshold in kiwa to one of three grounded rationales:

1. **Provider SLA** — the third-party API kiwa mocks documents its own p99 latency. The kiwa threshold sits at or under that so a passing mock behaves at least as fast as the real thing.
2. **Human-perception target** — for user-facing SaaS surfaces (chat, cursor, notification), Jakob Nielsen's classic thresholds apply: 100 ms feels instant, 1 s keeps flow, 10 s loses users. Kiwa targets the strictest applicable band.
3. **Mock-invariant** — a mock is in-memory code. Its perf floor is the JS engine's own event-loop tick + heap allocation cost. When a mock's p95 exceeds this floor by more than one order of magnitude, something is architecturally wrong (e.g. accidentally awaiting a promise chain per call). Kiwa targets < 10 × the JS floor.

## Threshold table

| Target | Op | p95 threshold | Rationale |
|---|---|---|---|
| `@kiwa/quality-metrics` | `evaluateReleaseGate` | 5 ms | mock-invariant (pure calculation, one heap object per call) |
| `@kiwa/quality-metrics` | `diffReports` | 5 ms | mock-invariant |
| `@kiwa/ai-llm` | `anthropic.messages.create` (mock) | 40 ms | provider SLA — Anthropic Messages p95 non-streaming is ~600ms; mock must be < 10 % of live so tests do not become the bottleneck |
| `@kiwa/ai-llm` | `openai.chat.completions.create` (mock) | 40 ms | provider SLA — OpenAI Chat Completions p95 is ~500-1200ms depending on model; same 10 % rule |
| `@kiwa/ai-llm` | `vercel.generateText` (mock) | 40 ms | provider SLA — proxies to Anthropic / OpenAI, same target |
| `@kiwa/ai-llm` | `langchain.invoke` (mock) | 40 ms | provider SLA — same |
| `@kiwa/realtime` | `supabase.channel.track` (mock) | 20 ms | mock-invariant (channel registry lookup + presence Map insert) |
| `@kiwa/realtime` | `ably.channel.publish` (mock) | 20 ms | mock-invariant |
| `@kiwa/realtime` | `pusher.subscribeChannel` (mock) | 20 ms | mock-invariant |
| `@kiwa/realtime` | `socketio.emit` (mock) | 20 ms | mock-invariant |
| `@kiwa/payment` | `signWebhook` (mock) | 10 ms | mock-invariant (HMAC-SHA256 over ~500 bytes is < 1 ms on modern hardware) |
| `@kiwa/payment` | `verifyWebhook` (mock) | 10 ms | mock-invariant |
| `@kiwa/search` | `search` on 20-doc index (mock) | 5 ms | mock-invariant (linear scan over 20 docs) |
| `dogfood-anthropic-chatbot` | `reply` (mock mode) | 30 ms | mock-invariant + one @kiwa/ai-llm call ⇒ threshold matches ai-llm + adapter overhead budget |
| `dogfood-anthropic-chatbot` | `replyStream` (mock mode) | 50 ms | mock-invariant + streaming chunk fan-out (~5 chunks) ⇒ 5 × single-call budget |
| `dogfood-anthropic-chatbot` | `toolLoop` (mock mode) | 100 ms | mock-invariant + tool loop up to 5 iterations |
| `dogfood-openai-tool-agent` | `validateToolSchemas` | 50 ms | mock-invariant (JSON Schema validate over 3 tools) |
| `dogfood-openai-tool-agent` | `runToolLoop` | 100 ms | tool loop up to 5 iterations, matches Anthropic loop budget |
| `dogfood-openai-tool-agent` | `runParallelToolCall` | 100 ms | 2 parallel tools + finaliser turn |
| `dogfood-vercel-ai-rag` | `embed` (mock) | 20 ms | mock-invariant (hashing embedder) |
| `dogfood-vercel-ai-rag` | `retrieve` (mock) | 30 ms | mock-invariant + cosine similarity over ~5 docs |
| `dogfood-vercel-ai-rag` | `answer` (mock) | 100 ms | retrieve + LLM call budget |
| `dogfood-supabase-realtime-chat` | `joinRoom` | 50 ms | Nielsen "instant" — chat presence must feel snappy |
| `dogfood-supabase-realtime-chat` | `sendMessage` | 30 ms | Nielsen "instant" tightened — message send is on the critical hot path |
| `dogfood-supabase-realtime-chat` | `getPresence` | 30 ms | Nielsen "instant" |
| `dogfood-supabase-realtime-chat` | `sendTyping` | 100 ms | typing debounce absorbs 500 ms; single-call p95 has more headroom |
| `dogfood-ably-collab-cursor` | `joinBoard` | 50 ms | Nielsen "instant" |
| `dogfood-ably-collab-cursor` | `moveCursor` | 100 ms | 60 fps throttle window is 16 ms; single call inside the throttle allowed 100 ms because it burst-fires |
| `dogfood-ably-collab-cursor` | `rewindHistory` | 30 ms | in-memory ring buffer scan |
| `dogfood-ably-collab-cursor` | `getPresence` | 30 ms | Nielsen "instant" |
| `dogfood-socketio-notification` | `subscribeRoom` | 50 ms | Nielsen "instant" |
| `dogfood-socketio-notification` | `deliverNotification` | 30 ms | Nielsen "instant" |
| `dogfood-socketio-notification` | `getPending` | 30 ms | Nielsen "instant" |
| `dogfood-socketio-notification` | `simulateReconnect` | 100 ms | reconnect ceremony (disconnect + queue drain + reconnect) |
| `@kiwa/core` | `parseSpec` | 5 ms | mock-invariant (linear scan over meta lines + one table walk) |
| `@kiwa/core` | `createPool` (size 4) | 5 ms | mock-invariant (Promise.all fan-out over 4 acquires + one borrow/release) |
| `@kiwa/dapp` | `eventEmitterEmit` | 5 ms | mock-invariant (node:events dispatch + listener count) |
| `@kiwa/dapp` | `anvilKeyLookup` | 5 ms | mock-invariant (readonly array indexing) |
| `@kiwa/api` | `requestClientGet` | 5 ms | mock-invariant (url join + Response snapshot with stub fetcher) |
| `@kiwa/api` | `requestClientPost` | 5 ms | mock-invariant (adds JSON.stringify encode over the GET path) |
| `@kiwa/ui` | `setupComponentEnvSnapshot` | 30 ms | jsdom mount + React render + innerHTML capture — the lightest UI test path |
| `@kiwa/ui` | `setupComponentEnvRender` | 30 ms | same jsdom + React mount cost baseline as snapshot |
| `@kiwa/data` | `queueSend` | 5 ms | mock-invariant (dedup Set lookup + array push + consumer notify) |
| `@kiwa/data` | `fakeClockAdvance` | 5 ms | mock-invariant (walk 2-entry cron table + fire due callbacks) |
| `@kiwa/cli-test` | `writeFile` | 20 ms | fs write syscall + relative path resolution over an isolated tempdir |
| `@kiwa/cli-test` | `readFile` | 10 ms | fs read syscall over an isolated tempdir |
| `@kiwa/observability` | `collectRunHistory` | 5 ms | O(N) walk + per-test cap map over 200 records |
| `@kiwa/observability` | `detectFlaky` | 5 ms | O(N) aggregation over 200 records |
| `@kiwa/observability` | `checkThresholds` | 5 ms | mock-invariant (fixed 4-metric compare) |
| `@kiwa/observability` | `renderDashboard` | 5 ms | markdown string concat over a 200-record summary |
| `@kiwa/e2e` | `fetchOverLoopback` | 20 ms | node http server dispatch + fetch-handler adapter over loopback (no network) |
| `@kiwa/cli` | `runSpecToTest` | 20 ms | md read + parseSpec + template render + file write |

## Regression detection defaults

Threshold: **20 % p95 delta** vs stored baseline (`.perf-baseline/{module}.json`), with Welch t-test for significance (t > 2 ⇒ significant).

- baseline is created automatically on the first run (no `--baseline` flag needed since v1.14-post)
- subsequent runs compare against baseline; a > 20 % p95 increase with significant t-value fails the gate
- to intentionally accept the new baseline (e.g. after a deliberate optimisation regression), delete `.perf-baseline/{module}.json` and rerun

## Real-API measurement mode

Live-mode perf tests coexist with mock perf tests under `tests/perf/`. The `*.live.perf.ts` files use `runPerf3LayerLive` from `@kiwa/perf-harness` and declare their required env vars via the `requiredEnv` option. Missing env vars trigger the skip path — the run still emits a report, but with `LIVE_ENV_MISSING` markers instead of gate results. This keeps CI-less environments honest: an empty report row is attributed to missing credentials, not silent success.

Enable live mode by setting the required env vars and rerunning the perf suite:

```bash
# Live mode for one provider
export ANTHROPIC_API_KEY=sk-ant-...
pnpm --filter dogfood-anthropic-chatbot test:perf
# Mock 3-layer runs alongside; live 3-layer runs against the real API

# All 6 dogfood live envs
export ANTHROPIC_API_KEY=sk-ant-... OPENAI_API_KEY=sk-... \
  SUPABASE_URL=https://... SUPABASE_ANON_KEY=... \
  ABLY_API_KEY=... SOCKETIO_URL=https://... \
  RAG_VECTOR_STORE_URL=https://... RAG_VECTOR_STORE_API_KEY=...
pnpm -r --parallel run test:perf --if-present
```

Live iteration count defaults to 10 (vs 200 for mock) — live calls cost money and are slow, so a full pass fits in a coffee break. Concurrency defaults to 3 to avoid rate-limiting.

Live thresholds are provider-SLA sourced — not mock-invariant — and sit at the provider's own p95 target:

| provider | live p95 threshold | source |
|---|---|---|
| Anthropic Messages (non-streaming) | 1500 ms | Anthropic status page + latency dashboards |
| OpenAI Chat Completions (non-streaming, gpt-4o) | 1500 ms | OpenAI status page |
| Supabase Realtime publish | 250 ms | Supabase Realtime WebSocket round-trip target |
| Ably publish (round-trip) | 200 ms | Ably SLA — 99.999 % delivery within 200 ms |
| Socket.io emit (loopback) | 100 ms | in-cluster network + Redis adapter round-trip |

## Concurrent load target

Every mock target has a serial baseline (concurrency = 1) and a concurrent stress run (concurrency = 10, iterations per worker = 50 ⇒ 500 samples). The concurrent p95 threshold is **2 × the serial threshold** — mocks share in-memory state (engines, recorders), so some contention is expected but > 2 × means the shared state is a bottleneck.

## Memory delta target

Every mock op is checked for retained-heap growth. Threshold: **< 100 KB retained across 200 iterations** (i.e. < 500 bytes / call on average). Anything higher signals an unbounded internal Map / array / listener list.

## Change control

If a threshold in the table changes, the PR body must document:

1. Which threshold changed and by how much
2. Which of the 3 rationales (provider SLA / human perception / mock-invariant) still applies
3. If none apply, a new rationale row must be added to this file

The rules/quality.md § test-passed marker gate forwards to this doc for perf assertions.
