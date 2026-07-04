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
