---
title: kiwa tutorials
---

# kiwa tutorials

Step-by-step tutorials that take a fresh reader from "no kiwa installed" to a runnable test in under 10 minutes. Each tutorial is self-contained — the code samples paste directly into an empty repo and pass.

## Tutorial index

| # | Tutorial | Runtime | Time |
|---|---|---|---|
| 1 | [Your first Supabase Auth test in 5 min](./01-supabase-auth-first-test) | Node.js / vitest | 5 min |
| 2 | [RabbitMQ DLX test recipe](./02-rabbitmq-dlx-recipe) | Node.js / vitest | 8 min |
| 3 | [Rust contract test from zero](./03-rust-contract-from-zero) | Rust / cargo | 10 min |
| 4 | [Testing Next.js Server Actions with @kiwa-test/nextjs](./04-nextjs-server-actions) | Node.js / vitest | 6 min |
| 5 | [Multi-provider auth (NextAuth + Clerk + Auth0)](./05-multi-provider-auth) | Node.js / vitest | 12 min |
| 6 | [Anthropic chatbot streaming + tool_use](./06-anthropic-chatbot-streaming) | Node.js / vitest | 10 min |
| 7 | [OpenAI tool-use agent (function calling + parallel)](./07-openai-tool-agent) | Node.js / vitest | 10 min |
| 8 | [Vercel AI SDK + LangChain RAG pipeline](./08-vercel-ai-rag) | Node.js / vitest | 12 min |
| 9 | [Supabase Realtime chat + presence + typing debounce](./09-supabase-realtime-chat) | Node.js / vitest | 10 min |
| 10 | [Ably shared cursor + 60 fps throttle + history rewind](./10-ably-collab-cursor) | Node.js / vitest | 10 min |
| 11 | [Socket.io notification + reconnect + backpressure](./11-socketio-notification) | Node.js / vitest | 12 min |
| 12 | [Payment webhook mock (Stripe / Paddle / Lemon Squeezy)](./12-payment) | Node.js / vitest | 10 min |
| 13 | [Search mock (Meilisearch / Algolia / Typesense)](./13-search) | Node.js / vitest | 10 min |
| 14 | [Telemetry mock (OpenTelemetry / Datadog / Sentry)](./14-observability) | Node.js / vitest | 10 min |
| 15 | [kiwa-test-go v0.5 Iris + Chi](./15-go-iris-chi) | Go / go test | 10 min |
| 16 | [Multimodal chat (image + audio + Whisper)](./16-multimodal-chat) | Node.js / vitest | 12 min |
| 17 | [MCP tool-use agent (JSON-RPC 2.0 chain)](./17-mcp-tool-agent) | Node.js / vitest | 12 min |
| 18 | [Agent orchestration (LangGraph + Assistants v2)](./18-agent-orchestration) | Node.js / vitest | 12 min |
| 19 | [Storybook 8 design system](./19-storybook-design-system) | Node.js / vitest | 12 min |
| 20 | [Playwright CT for 5 form patterns](./20-playwright-ct) | Node.js / vitest | 12 min |
| 21 | [Visual regression baseline / diff / accept](./21-visual-regression) | Node.js / vitest | 12 min |
| 22 | [Observability dashboard (panel + refresh + badge)](./22-observability-dashboard) | Node.js / vitest | 10 min |
| 23 | [Alert orchestrator (rule + route + silence + escalation)](./23-alert-orchestrator) | Node.js / vitest | 12 min |
| 24 | [Trace flame graph (span tree + drill-down + log correlation)](./24-trace-flame-graph) | Node.js / vitest | 12 min |
| 25 | [Reth node test (dev chain + reorg + fidelity matrix)](./25-reth-node-test) | Rust / cargo | 10 min |
| 26 | [Foundry invariant + fuzz runner (10 000 runs + shrink parser)](./26-foundry-invariant-fuzz) | Rust / cargo | 12 min |
| 27 | [dApp e2e reorg (snapshot + revert + refetch across 4 scenarios)](./27-dapp-e2e-reorg) | Node.js / Playwright | 12 min |
| 28 | [SolidJS Signal + Effect + Resource + Suspense (fine-grained reactivity)](./28-solidjs-signal-app) | Node.js / vitest | 10 min |
| 29 | [Fresh Islands + Route Handler + Head normalize (Deno partial hydration)](./29-fresh-islands) | Node.js / vitest | 10 min |
| 30 | [HonoJS + hc RPC type-safe client + Workers env (KV / D1 / R2)](./30-hono-workers-rpc) | Node.js / vitest | 12 min |
| 31 | [Kafka event pipeline (producer + consumer group + exactly-once + DLQ)](./31-kafka-event-pipeline) | Node.js / vitest | 12 min |
| 32 | [Redpanda + schema registry (Avro schemas + evolution + compatibility)](./32-redpanda-schema-registry) | Node.js / vitest | 12 min |
| 33 | [NATS JetStream (persistent streams + KV + Object store + subject routing)](./33-nats-jetstream) | Node.js / vitest | 12 min |
| 34 | [WebAuthn L3 + Passkey (virtual authenticator + attestation + sync fabric)](./34-webauthn-passkey) | Node.js / vitest | 12 min |
| 35 | [OAuth 2.1 provider (PKCE + DPoP + refresh rotation + revocation)](./35-oauth21-provider) | Node.js / vitest | 12 min |
| 36 | [OIDC provider + Federation (Discovery + DCR + id_token + trust chain)](./36-oidc-federation) | Node.js / vitest | 12 min |
| 37 | [Real driver testing (Keycloak + oauth2-mock-server testcontainers)](./37-real-driver-testing) | Node.js / vitest + Docker | 15 min |
| 38 | [Passkey caBLE hybrid transport (QR + BLE + WebSocket tunnel)](./38-passkey-cable-flow) | Node.js / vitest | 15 min |
| 39 | [Stripe advanced billing (subscription + 3DS + dunning)](./39-stripe-billing) | Node.js / vitest | 15 min |
| 40 | [Paddle merchant-of-record (inline checkout + tier + VAT/GST auto-calc)](./40-paddle-merchant) | Node.js / vitest | 15 min |
| 41 | [Lemon Squeezy refund + chargeback dispute lifecycle](./41-lemon-squeezy-license) | Node.js / vitest | 15 min |
| 42 | [Cloudflare Workers Durable Object (realtime chat + Hibernation + storage)](./42-cloudflare-durable-object) | Node.js / vitest | 15 min |
| 43 | [Vercel Edge streaming (Next.js 15 middleware + geo routing + SSE backpressure)](./43-vercel-edge-streaming) | Node.js / vitest | 15 min |
| 44 | [Deno Deploy geo (Deno KV + read-your-writes + Cron trigger)](./44-deno-deploy-geo) | Node.js / vitest | 15 min |
| 45 | [Perf-harness baseline (p95 baseline + regression detection walkthrough)](./45-perf-harness-baseline) | Node.js / vitest | 15 min |
| 46 | [Perf baseline migration (3 package → 33 package transfer methodology)](./46-perf-baseline-migration) | Node.js / vitest | 15 min |
| 47 | [Postgres CDC + outbox pattern (change data capture walkthrough)](./47-postgres-cdc-outbox) | Node.js / vitest | 15 min |
| 48 | [MySQL RLS + multi-tenant (row-level security walkthrough)](./48-mysql-rls-tenant) | Node.js / vitest | 15 min |
| 49 | [pgvector + hybrid search (semantic + keyword retrieval walkthrough)](./49-vector-search-pgvector) | Node.js / vitest | 15 min |
| 50 | [Mutation testing baseline (Stryker + kill-rate baseline + tier gate walkthrough)](./50-mutation-testing-baseline) | Node.js / vitest + Stryker | 15 min |
| 51 | [Mutation baseline migration (22 → 33 package sweep methodology)](./51-mutation-baseline-migration) | Node.js / vitest + Stryker | 15 min |
| 52 | [WebRTC video call (signaling + ICE + simulcast + ICE restart walkthrough)](./52-webrtc-video-signaling) | Node.js / vitest | 15 min |
| 53 | [WebTransport stream (uni / bi / Datagram / migration walkthrough)](./53-webtransport-stream) | Node.js / vitest | 15 min |
| 54 | [HTTP/3 multiplex (stream priority + HPACK + 0-RTT walkthrough)](./54-http3-multiplex) | Node.js / vitest | 15 min |
| 55 | [Release script filter SSOT (systematic root cause pattern walkthrough)](./55-release-script-filter-ssot) | Node.js / vitest | 15 min |
| 56 | [A11y baseline (axe-core + WCAG 2.1 AA gate + 3-layer harness walkthrough)](./56-a11y-baseline) | Node.js / vitest + jsdom | 15 min |
| 57 | [A11y baseline migration (0 → 34 package sweep methodology)](./57-a11y-baseline-migration) | Node.js / vitest + jsdom | 15 min |

## AI-LLM tutorials (v1.12)

Tutorials 06 – 08 exercise the [`@kiwa-test/ai-llm`](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/README.md) harness — one for each of Anthropic Messages API, OpenAI Chat Completions, and Vercel AI SDK + LangChain. See [`docs/concepts/ai-llm-testing.md`](../concepts/ai-llm-testing) for why AI-LLM providers need extra fidelity / cost / accuracy axes.

## Realtime tutorials (v1.13)

Tutorials 09 – 11 exercise the new [`@kiwa-test/realtime`](https://github.com/cardene777/kiwa/blob/main/packages/realtime/README.md) harness — one for each of Supabase Realtime, Ably, and Socket.io / SSE (Pusher shares the same engine but is not called out as a dedicated tutorial in v1.13). See [`docs/concepts/realtime-testing.md`](../concepts/realtime-testing) for the 5 time-axis semantics (order / timing / drop / reconnect / backpressure) that realtime tests need beyond the request/response mocks of v1.11 + v1.12.

## Component test tutorials (v1.16)

Tutorials 19 – 21 exercise the new [`@kiwa-test/component`](https://github.com/cardene777/kiwa/blob/main/packages/component/README.md) harness — one for each of Storybook 8 (story registration + args + play + a11y), Playwright Component Testing (mount + interact + assert), and Chromatic (baseline / diff / accept / reject). See [`docs/concepts/component-testing.md`](../concepts/component-testing) for the 3 surfaces + 6 semantic axes that component tests need beyond the request/response mocks of v1.11 + v1.12 + v1.13.

## Observability v2 tutorials (v1.17)

Tutorials 22 – 24 exercise the v2.0 additions to [`@kiwa-test/observability`](https://github.com/cardene777/kiwa/blob/main/packages/observability/README.md) — one for each of Grafana-style dashboards (panel refresh + threshold badge), Prometheus AlertManager (rule / route / silence / escalation lifecycle), and Jaeger flame graphs (span tree + drill-down + log correlation). See [`docs/concepts/observability-v2-testing.md`](../concepts/observability-v2-testing) for the 4 axes v2 adds on top of the v1.1 `TelemetryCollector` and where the fidelity harness fits in.

## Blockchain 深化 tutorials (v1.18)

Tutorials 25 – 27 exercise the v0.5 additions to [`kiwa-test-rs`](https://github.com/cardene777/kiwa/blob/main/kiwa-rs/README.md) and the reorg helpers in [`@kiwa-test/dapp`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/README.md) — one for each of Reth NodeBuilder dev chain integration (`RethNode::spawn_dev` + `reth_reorg` + 7-row fidelity matrix), Foundry invariant + fuzz runner (10 000 runs with deterministic seed and shrink parser), and Playwright dApp reorg regression (`snapshotChain` / `revertChain` across 4 scenarios). See [`docs/concepts/blockchain-testing.md`](../concepts/blockchain-testing) for the 4 axes v1.18 adds on top of the v1.10 `contract::foundry` + `contract::alloy` base and where each axis lands in the release-gate fidelity ratio.

## Framework 深化 tutorials (v1.19)

Tutorials 28 – 30 exercise the three new modern web framework adapters — [`@kiwa-test/solidjs`](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/README.md), [`@kiwa-test/fresh`](https://github.com/cardene777/kiwa/blob/main/packages/fresh/README.md), and [`@kiwa-test/hono`](https://github.com/cardene777/kiwa/blob/main/packages/hono/README.md). Each cuts down to a single vitest suite that walks the framework's characteristic runtime contract without booting the real runtime — SolidJS Signal-based fine-grained reactivity + Suspense-shaped resources (`mockSignal` / `mockEffect` / `batch` / `createResourceStub` / `renderWithSuspense`), Deno Fresh Islands architecture + Route Handler + Head normalize (`invokeFreshHandler` / `defineIsland` / `hydrateIslands` / `mergeHead`), and Cloudflare Workers-style HonoJS + hc typed RPC + KV / D1 / R2 mocks (`createHonoApp` / `createRpcClient` / `mockKVNamespace` / `mockD1Database` / `mockR2Bucket`). See [`docs/concepts/modern-web-framework-testing.md`](../concepts/modern-web-framework-testing) for the 4 axes v1.19 adds on top of the v1.14 horizontal framework baseline.

## Streaming 深化 tutorials (v1.20)

Tutorials 31 – 33 exercise the new [`@kiwa-test/streaming`](https://github.com/cardene777/kiwa/blob/main/packages/streaming/README.md) unified mock — one for each of Kafka (kafkajs-shaped producer / consumer group / transactional producer / DLQ), Redpanda (Kafka API compat + colocated schema registry with BACKWARD / FORWARD / FULL compatibility gates), and NATS JetStream (persistent streams + KV Store + Object Store + subject-based routing with `*` single-token and `>` trailing-multi-token wildcards). See [`docs/concepts/streaming-testing.md`](../concepts/streaming-testing) for the 5 semantics (producer / consumer / exactly-once / DLQ / schema-registry) that streaming tests need beyond the time-axis mocks of v1.13.

## Auth 深化 tutorials (v1.21)

Tutorials 34 – 36 exercise the four new protocol adapters in [`@kiwa-test/auth`](https://github.com/cardene777/kiwa/blob/main/packages/auth/README.md) — `setupWebAuthnEnv` (WebAuthn L3 virtual authenticator + attestation), `setupPasskeyEnv` (Passkey sync fabric backup + restore), `setupOAuth21Env` (OAuth 2.1 mock AS with PKCE + DPoP + refresh rotation + revocation), and `setupOidcEnv` (OIDC mock OP with Discovery + DCR + `id_token` sign / verify + JWKS rotation + OpenID Federation trust-chain resolution). See [`docs/concepts/auth-protocol-testing.md`](../concepts/auth-protocol-testing) for the 4 axes (virtual authenticator / PKCE+DPoP / id_token / discovery+federation) that interactive auth tests need beyond the session-shaped mocks of v1.10-2.

## Real driver tutorials (v1.22)

Tutorials 37 – 38 exercise the v1.22 real driver layer on top of the v1.21 4 protocol mocks — Keycloak testcontainers wiring for OIDC + Federation, oauth2-mock-server testcontainers for OAuth 2.1, Chrome caBLE hybrid transport for Passkey. Tutorial 37 walks the 3 execution modes (`mock only` / `real-optional` / `real-required`) end-to-end with a Keycloak container; tutorial 38 walks the CTAP2 hybrid transport 5-axis fidelity harness (QR generation / BLE advertisement handshake / WebSocket tunnel establishment / credential migration payload / signature roundtrip). See [`docs/concepts/real-driver-testing.md`](../concepts/real-driver-testing) for the 3 execution modes SSOT + the fidelity axis catalog across all 3 v1.22 dogfood apps.

## Payment 深化 tutorials (v1.23)

Tutorials 39 – 41 exercise the v0.3 additions to [`@kiwa-test/payment`](https://github.com/cardene777/kiwa/blob/main/packages/payment/README.md) — 9 axes of advanced billing semantics (dunning / retry / 3DS v2 / SCA / PSD2 mandate / subscription lifecycle / invoice lifecycle / VAT-GST-sales-tax / chargeback dispute) — one for each of the 3 target providers Stripe (Next.js 15 subscription + 3DS + Smart Retries dunning), Paddle (Nuxt 3 merchant-of-record + inline checkout + tier upgrade + VAT/GST auto-calc), and Lemon Squeezy (SvelteKit hosted checkout + license key + refund + chargeback dispute). See [`docs/concepts/billing-semantics.md`](../concepts/billing-semantics) for the 9-axis SSOT + provider-specific fidelity surface reference across all 3 v1.23 dogfood merchant apps.

## Edge/Serverless 深化 tutorials (v1.24)

Tutorials 42 – 44 exercise the v0.2 additions to [`@kiwa-test/edge`](https://github.com/cardene777/kiwa/blob/main/packages/edge/README.md) — 8 axes of advanced edge semantics (Durable Object / WebSocket edge / edge KV / geo-replicated / Cron trigger / subrequest limit / CPU time limit / streaming Response) — one for each of the 3 target platforms Cloudflare Workers (realtime chat via Durable Objects + Hibernation API + storage transactional + WebSocket edge broadcast), Vercel Edge (Next.js 15 middleware + geo routing + edge KV cache invalidation + SSE streaming with backpressure), and Deno Deploy (Fresh + multi-region Deno KV write + read-your-writes consistency + Deno Deploy Cron + queue trigger). See [`docs/concepts/edge-runtime-testing.md`](../concepts/edge-runtime-testing) for the 8-axis SSOT + platform-specific fidelity surface reference across all 3 v1.24 dogfood edge apps.

## Perf-harness sweep tutorials (v1.25)

Tutorials 45 – 46 exercise the v0.2 rollout of [`@kiwa-test/perf-harness`](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/README.md) — the p50 / p95 / p99 measurement + baseline persistence + regression detection primitives from v1.13-1 now applied to every kiwa package (33 total). Tutorial 45 walks the primitive stack (`measure` + `saveBaseline` + `loadBaseline` + `detectRegression` + `evaluatePerfGate`) against a trivial pure function so the numbers are easy to reason about; tutorial 46 documents the 6-step migration recipe used across the v1.25-1 through v1.25-4 sub-milestones to add a perf suite to any new package in under 15 minutes. See [`docs/concepts/perf-testing-ssot.md`](../concepts/perf-testing-ssot) for the p50 / p95 / p99 SSOT + 3-layer harness rules (3 warmup + 100 iteration + 20 % threshold) + the 33 package coverage grid across core / framework adapter / test type / SaaS layer.

## Database 深化 tutorials (v1.26)

Tutorials 47 – 49 exercise the v0.9 additions to [`@kiwa-test/orm`](https://github.com/cardene777/kiwa/blob/main/packages/orm/README.md) — 8 axes of advanced db semantics (replication / CDC / logical replication / MVCC / RLS / connection pool / partitioning / vector store) layered on top of the v0.8 `setupOrmEnv` — one for each of the 3 target dogfood app combinations Postgres CDC + outbox (Next.js 15 + drizzle + Postgres 16 logical replication + Debezium-style outbox + Redis Streams consumer), MySQL RLS + multi-tenant (Nuxt 3 + Prisma + MySQL 8 row-level security policy + tenant isolation + audit log), and pgvector + hybrid search (SvelteKit + kysely + Postgres 16 + pgvector IVFFlat / HNSW + hybrid ranking). See [`docs/concepts/db-advanced-testing.md`](../concepts/db-advanced-testing) for the 8-axis SSOT + provider × backend fidelity table + 3 × 3 × 8 = 72 row coverage grid across all 3 v1.26 dogfood db apps.

## Mutation testing sweep tutorials (v1.27)

Tutorials 50 – 51 exercise the v0.3 additions to [`@kiwa-test/quality-metrics`](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/README.md) — the 4-tier mutation SSOT (`DEFAULT_MUTATION_TIER_THRESHOLDS` + `resolveMutationTier` + `assertMutationTier`) + 12-axis release gate (`evaluateReleaseGate({ mutationTier })`) — layered on top of the v0.2 7 / 11-axis release gate — now applied to every kiwa package across the 4 layers Core / Framework / SaaS / Test type. Tutorial 50 walks the primitive stack (Stryker `stryker.config.mjs` + baseline JSON persistence + `assertMutationTier` + `evaluateReleaseGate` 12-axis path) against a trivial pure function so the mutants are easy to reason about; tutorial 51 documents the 6-step migration recipe used across the v1.27-1 through v1.27-3 sub-milestones to add a mutation baseline + tier gate to any new package in under 15 minutes. See [`docs/concepts/mutation-testing-ssot.md`](../concepts/mutation-testing-ssot) for the kill rate + 4-tier threshold SSOT + baseline persistence + 12-axis release gate integration + 3-layer harness alignment across the 33 package coverage grid.

## Advanced realtime transport tutorials (v1.28)

Tutorials 52 – 54 exercise the v0.2 additions to [`@kiwa-test/realtime`](https://github.com/cardene777/kiwa/blob/main/packages/realtime/README.md) — 3 protocol × 8 axis low-layer transport mocks (`createWebRtcSignalingMock` + `createWebRtcIceMock` + `createWebRtcTrackMock` + `createWebRtcDataChannelMock` + `createWebTransportUniMock` + `createWebTransportBiMock` + `createHttp3PushMock` + `createQuicMultiplexMock`) + 24-row `SEMANTICS_GRID` + `measureSemanticsAxis` / `measureSemanticsGrid` fidelity harness + `resolveRealtimeDriver` env-gate — layered on top of the v0.1 5 time-axis semantics — now exercised through 3 dogfood apps (Next.js 15 + mediasoup WebRTC video call / Nuxt 3 + aioquic WebTransport stream room / SvelteKit + nginx-quic HTTP/3 QUIC multiplex). Tutorial 52 walks the WebRTC video call adapter (`VideoCallAdapter` — 8 ops covering signaling / ICE / track / simulcast / ICE restart, seed-offset per peer to preserve mediasoup's unique-fingerprint invariant); tutorial 53 walks the WebTransport stream adapter (`WebTransportStreamAdapter` — 9 ops covering uni / bi / backpressure / reset / Datagram / connection migration, per-stream flow-control window semantics); tutorial 54 walks the HTTP/3 multiplex adapter (`Http3MultiplexAdapter` — 9 ops covering priority-scheduled concurrent streams / HPACK dynamic table / 0-RTT anti-replay refusal / FIN on closeStream). See [`docs/concepts/webrtc-webtransport-testing.md`](../concepts/webrtc-webtransport-testing) for the 8-axis SSOT + 24-row grid + protocol × framework fidelity table + P2P vs SFU selection guide + ICE trickle vs half-trickle + WebTransport vs WebSocket differences reference across all 3 v1.28 dogfood realtime apps.

## Release invariants tutorials (v1.29)

Tutorial 55 exercises the v0.1 release of [`@kiwa-test/release-invariants`](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/README.md) — 3 pure invariant checkers (`checkReleaseScriptFilter` + `checkProvenanceFlagAbsence` + `checkGateScriptPackageCoverage`) + 1-shot `buildReleaseInvariantsSummary` aggregator — the systematic root cause pattern SSOT that turned a 4-time recurring release script filter bug into a first-class fail-fast release-smoke axis. Tutorial 55 walks the provider-neutral `ReleaseInvariantsAdapter` contract with a mock adapter + a file adapter, plus 4 RED / GREEN behavior tests that pin the exact failure modes v1.14 payment / v1.25 perf-harness / v1.27 quality-metrics / v1.28 realtime all rediscovered. See [`docs/concepts/release-invariants.md`](../concepts/release-invariants) for the 3-invariant SSOT + systematic root cause pattern + 4-time rediscovery ledger + 7-milestone snippet validation streak reference.

## A11y sweep tutorials (v1.30)

Tutorials 56 – 57 exercise the v1.1 rollout of [`@kiwa-test/a11y`](https://github.com/cardene777/kiwa/blob/main/packages/a11y/README.md) — the v1.0 `runAxe` + `reportViolations` + `expectNoViolations` primitives from v1.16 now applied to every kiwa package (34 total), plus the new v1.1 3-layer harness (`runLayerHarness` + `bucketViolations` + `unionByRule` + `computeTotals` + `isHarnessOk` + `summariseHarness`) that unions jsdom + Playwright + SSR-hydration violations by rule id with provenance. Tutorial 56 walks the primitive stack (`runAxe` with WCAG 2.1 AA tag filter + `runLayerHarness` with jsdom fixture + `a11yFromBaseline` + `assertA11yTier` + `evaluateReleaseGate` 13-axis path) against a trivial labelled markup so the impact buckets are easy to reason about; tutorial 57 documents the 6-step migration recipe used across the v1.30-1 through v1.30-3 sub-milestones to add an a11y baseline + tier gate to any new package in under 15 minutes. See [`docs/concepts/a11y-testing-ssot.md`](../concepts/a11y-testing-ssot) for the WCAG 2.1 AA SSOT + 4-tier threshold rationale + baseline persistence + 3-layer harness rules + jsdom vs Playwright vs SSR-hydration nuances across the 34 package coverage grid.
