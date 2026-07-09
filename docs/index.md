---
layout: home

hero:
  name: kiwa
  text: OSS test framework
  tagline: dApps + web apps + full-stack frameworks + polyglot (TypeScript / Rust / Go / Python). One toolchain, every layer.
  actions:
    - theme: brand
      text: Get started (5-min tutorial)
      link: /tutorials/01-supabase-auth-first-test
    - theme: alt
      text: View on GitHub
      link: https://github.com/cardene777/kiwa

features:
  - title: 30 skills, one workflow
    details: /kiwa-design → /kiwa-forge / /kiwa-hardhat / /kiwa-play / /kiwa-vitest / /kiwa-rust / /kiwa-go / /kiwa-auth / /kiwa-queue / /kiwa-cache → /kiwa-review. Layer 1 spec + Layer 2 code generation + Layer 3 verification, all under version control.
  - title: 11-axis release gate (v1.12)
    details: 7 common axes (coverage + test count + fidelity + perf p95 + mutation) plus 4 AI-LLM axes (cost + latency + token + accuracy) — the AI-LLM branch activates automatically when the provider prefix matches @kiwa-lab/ai-*. Release when the gate says PASS.
  - title: Real-vs-mock dogfood
    details: Every provider has an example that runs against the real service AND against the kiwa mock. Divergences feed the fidelity axis of the release gate. AI-LLM providers (Anthropic + OpenAI + Vercel AI SDK + LangChain) joined in v1.12; realtime providers (Supabase Realtime + Ably + Pusher + Socket.io) join in v1.13.
  - title: Polyglot from day 1
    details: TypeScript, Rust, Go, Python, Solidity — the same test skill chain drives all five languages.
---

## What is kiwa?

kiwa is an OSS test framework that treats "writing tests for a modern app" as a workflow instead of a menu. One kiwa install gives you:

- **23 TypeScript packages** — `@kiwa-lab/{core,dapp,api,ui,data,e2e,a11y,visual,cli-test,observability,nextjs,nuxt,sveltekit,remix,astro,solidstart,qwikcity,edge,orm,auth,queue,cache,quality-metrics}`
- **1 Rust crate** — `kiwa-test-rs` with `contract::foundry` + `contract::alloy` + axum + actix + tower-http adapters
- **1 Go module** — `kiwa-test-go` (gin / echo / fiber / net/http/httptest / testing.T)
- **1 Python distribution** — `kiwa-test-py` for pytest
- **30 skills** — reusable prompts that turn requirements into tests

## Getting started

```bash
pnpm add -D @kiwa-lab/auth @kiwa-lab/core vitest
```

Then read [Your first Supabase Auth test in 5 min](/tutorials/01-supabase-auth-first-test).

## Latest release

**v1.13 — Realtime + perf harness** (2026-07-03).

- `@kiwa-lab/realtime` v0.1 — new package with unified mocks for Supabase Realtime + Ably + Pusher + Socket.io / SSE, plus a real-vs-mock fidelity harness scoped to 5 realtime scenarios (chat broadcast, presence join/leave, postgres CDC, room subscribe race, reconnect with pending)
- `@kiwa-lab/perf-harness` v0.1 — new package with a 5-target perf benchmark helper (p50 / p95 / p99 + regression detection) feeding the release gate's `perf.p95Ms` axis
- 3 dogfood apps under `examples/dogfood-{supabase-realtime-chat,ably-collab-cursor,socketio-notification}/`
- New tutorials 09 – 11 + concept doc [`realtime-testing.md`](/concepts/realtime-testing) + [migration guide](/migrations/v1.12-to-v1.13)

See the [Roadmap](https://github.com/cardene777/kiwa#roadmap) for full milestone details.

## Roadmap

| Milestone | Status | Focus |
|---|---|---|
| v1.9 | ✅ | Multi-provider baseline |
| v1.10 | ✅ | Supabase Auth + RabbitMQ + Rust contract layer |
| v1.11 | ✅ | Quality metrics harness + dogfood app pattern + GitHub Pages |
| v1.12 | ✅ | AI-LLM axis expansion — 11-axis release gate + `@kiwa-lab/ai-llm` + 3 dogfood apps |
| v1.13 | ✅ 6/6 | Realtime + perf harness — `@kiwa-lab/realtime` v0.1 (4 provider mocks + fidelity harness) + `@kiwa-lab/perf-harness` v0.1 + 3 dogfood apps (chat / cursor / notification) |
