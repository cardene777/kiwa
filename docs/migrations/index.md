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

See [`docs/migrations/README.md`](./README) for the style guide and legacy migration content.
