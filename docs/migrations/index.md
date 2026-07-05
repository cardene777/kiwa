---
title: kiwa migration guides
---

# kiwa migration guides

Per-milestone migration guides that walk you through the code changes needed to consume a new kiwa release.

## Milestone index

| Milestone | Guide | Breaking? | Focus |
|---|---|---|---|
| [v1.9 → v1.10](./v1.9-to-v1.10) | ✅ | Additive-only | Supabase Auth + RabbitMQ + Rust contract layer |
| [v1.10 → v1.11](./v1.10-to-v1.11) | ✅ | Additive-only | Quality metrics harness + dogfood app pattern + GitHub Pages |
| [v1.11 → v1.12](./v1.11-to-v1.12) | ⚠️ AI-LLM only | 7 → 11 axis release gate + `@kiwa-test/ai-llm` v0.1 (Anthropic + OpenAI + Vercel AI SDK + LangChain mocks) + 3 dogfood apps |
| [v1.12 → v1.13](./v1.12-to-v1.13) | ✅ | Additive-only | `@kiwa-test/realtime` v0.1 (Supabase Realtime + Ably + Pusher + Socket.io/SSE mocks) + `@kiwa-test/perf-harness` v0.1 + 3 dogfood apps (chat / cursor / notification) |
| [v1.13 → v1.14](./v1.13-to-v1.14) | ✅ | Additive-only | Horizontal expansion — payment + search + observability + Go framework adapters |
| [v1.14 → v1.15](./v1.14-to-v1.15) | ✅ | Additive-only | `@kiwa-test/ai-llm` v0.2 (multimodal + Whisper) + `@kiwa-test/mcp` v0.1 + `@kiwa-test/agent` v0.1 |
| [v1.15 → v1.16](./v1.15-to-v1.16) | ✅ | Additive-only | `@kiwa-test/component` v0.1 (Storybook 8 + Playwright CT + Chromatic unified mock) + 3 dogfood apps (design-system / form-ct / visual-regression) |
| [v1.16 → v1.17](./v1.16-to-v1.17) | ✅ | Additive-only | `@kiwa-test/observability` v2.0 (dashboard + alert + trace flame graph + log correlation) + 3 dogfood apps (dashboard / alert-orchestrator / trace-flame-graph) |
| [v1.17 → v1.18](./v1.17-to-v1.18) | ✅ | Additive-only | `kiwa-test-rs` v0.5 (Blockchain 深化 — `contract::reth` + `contract::foundry::invariant` + `contract::alloy::helpers`) + `@kiwa-test/dapp` reorg helpers + 3 dogfood apps (reth-node-test / foundry-invariant-fuzz / dapp-e2e-reorg) |
| [v1.18 → v1.19](./v1.18-to-v1.19) | ✅ | Additive-only | `@kiwa-test/solidjs` v0.1 (Signal + Effect + Resource + Suspense) + `@kiwa-test/fresh` v0.1 (Islands + Route Handler + Head normalize) + `@kiwa-test/hono` v0.1 (Cloudflare Workers + hc RPC + KV / D1 / R2) + 3 dogfood apps (solidjs-signal-app / fresh-islands / hono-workers-rpc) |
| [v1.19 → v1.20](./v1.19-to-v1.20) | ✅ | Additive-only | `@kiwa-test/streaming` v0.1 (Kafka + Redpanda + NATS unified mock — producer / consumer / exactly-once / DLQ / schema-registry 5 semantics + JetStream + KV + Object stores) + 3 dogfood apps (kafka-event-pipeline / redpanda-schema-registry / nats-jetstream) |
| [v1.20 → v1.21](./v1.20-to-v1.21) | ✅ | Additive-only | `@kiwa-test/auth` v1.21 (WebAuthn L3 + Passkey + OAuth 2.1 + OIDC + Federation — 4 protocol adapters: `setupWebAuthnEnv` / `setupPasskeyEnv` / `setupOAuth21Env` / `setupOidcEnv` covering virtual authenticator / PKCE+DPoP / id_token verify / trust chain) + 3 dogfood apps (webauthn-passkey-app / oauth21-provider / oidc-federation) |
| [v1.21 → v1.22](./v1.21-to-v1.22) | ✅ | Additive-only | `@kiwa-test/auth` v0.5 (real driver adapters + caBLE hybrid transport — Keycloak testcontainers OIDC + oauth2-mock-server testcontainers OAuth 2.1 + Chrome caBLE Passkey, `realDriver` option per adapter + 5 caBLE methods on `setupPasskeyEnv`, 3 execution modes SSOT: `mock only` / `real-optional` / `real-required`) + 3 dogfood app upgrades (oidc-federation Nuxt 3 RP full flow + a11y axe-core gate + Keycloak real driver + Federation JWKS rotation real e2e / oauth21-provider oauth2-mock-server real driver + /authorize §4.1.2.1 redirect Bug 1 fix / webauthn-passkey-app caBLE 5-axis fidelity harness) |
| [v1.22 → v1.23](./v1.22-to-v1.23) | ✅ | Additive-only | `@kiwa-test/payment` v0.3 (9-axis advanced billing semantics — dunning / retry / 3DS v2 / SCA / PSD2 mandate / subscription lifecycle / invoice lifecycle / VAT-GST-sales-tax / chargeback dispute, provider-neutral state machines + strict transition guards) + 3 dogfood merchant apps (dogfood-stripe-billing-app Next.js 15 + checkout + webhook + subscription + invoice + 3DS + dunning 35 vitest / dogfood-paddle-merchant-app Nuxt 3 + Paddle Billing v2 + inline checkout + tier + VAT/GST auto-calc 40 vitest / dogfood-lemon-squeezy-app SvelteKit + hosted checkout + license key + refund + chargeback 74 vitest) |
| [v1.23 → v1.24](./v1.23-to-v1.24) | ✅ | Additive-only | `@kiwa-test/edge` v0.2 (8-axis advanced edge semantics — Durable Object / WebSocket edge / edge KV / geo-replicated / Cron trigger / subrequest limit / CPU time limit / streaming Response, platform-neutral state machines + strict transition guards) + 3 dogfood edge apps (dogfood-cloudflare-workers-durable-object-app realtime chat + Hibernation API + storage transactional + WebSocket edge broadcast / dogfood-vercel-edge-function-app Next.js 15 middleware + geo routing + Vercel KV cache invalidation + SSE streaming with backpressure / dogfood-deno-deploy-geo-app Fresh + Deno KV geo-replicated + read-your-writes + Deno Deploy Cron + queue trigger) |
| [v1.24 → v1.25](./v1.24-to-v1.25) | ✅ | Additive-only | `@kiwa-test/perf-harness` v0.2 (33 package perf coverage sweep — same v0.1 `measure` + `saveBaseline` + `loadBaseline` + `detectRegression` + `evaluatePerfGate` + `runPerf3Layer` primitives, now applied to every kiwa package across the 4 layers core / framework adapter / test type / SaaS) + 2 tutorials (45 perf-harness baseline walkthrough + 46 perf baseline migration methodology) + 1 concept doc SSOT (perf-testing-ssot.md — p50 / p95 / p99 + baseline persistence + regression detection + 3-layer harness reference + 33 package coverage grid) + snippet validation test (docs-tutorial-v1.25.test.ts) |

See [`docs/migrations/README.md`](./README) for the style guide and legacy migration content.
