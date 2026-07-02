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
    details: 7 common axes (coverage + test count + fidelity + perf p95 + mutation) plus 4 AI-LLM axes (cost + latency + token + accuracy) — the AI-LLM branch activates automatically when the provider prefix matches @kiwa-test/ai-*. Release when the gate says PASS.
  - title: Real-vs-mock dogfood
    details: Every provider has an example that runs against the real service AND against the kiwa mock. Divergences feed the fidelity axis of the release gate. AI-LLM providers (Anthropic + OpenAI + Vercel AI SDK + LangChain) join in v1.12.
  - title: Polyglot from day 1
    details: TypeScript, Rust, Go, Python, Solidity — the same test skill chain drives all five languages.
---

## What is kiwa?

kiwa is an OSS test framework that treats "writing tests for a modern app" as a workflow instead of a menu. One kiwa install gives you:

- **23 TypeScript packages** — `@kiwa-test/{core,dapp,api,ui,data,e2e,a11y,visual,cli-test,observability,nextjs,nuxt,sveltekit,remix,astro,solidstart,qwikcity,edge,orm,auth,queue,cache,quality-metrics}`
- **1 Rust crate** — `kiwa-test-rs` with `contract::foundry` + `contract::alloy` + axum + actix + tower-http adapters
- **1 Go module** — `kiwa-test-go` (gin / echo / fiber / net/http/httptest / testing.T)
- **1 Python distribution** — `kiwa-test-py` for pytest
- **30 skills** — reusable prompts that turn requirements into tests

## Getting started

```bash
pnpm add -D @kiwa-test/auth @kiwa-test/core vitest
```

Then read [Your first Supabase Auth test in 5 min](/tutorials/01-supabase-auth-first-test).

## Latest release

**v1.12 — AI-LLM axis expansion** (2026-07-02).

- `@kiwa-test/quality-metrics` v0.2 — release gate expanded from 7 to 11 axes (cost / latency / token / accuracy added for `@kiwa-test/ai-*` providers only)
- `@kiwa-test/ai-llm` v0.1 — new package with unified mocks for Anthropic Messages API + OpenAI Chat Completions + Vercel AI SDK + LangChain, plus a real-vs-mock fidelity harness
- 3 dogfood apps under `examples/dogfood-{anthropic-chatbot,openai-tool-agent,vercel-ai-rag}/`
- New tutorials 06 – 08 + concept doc [`ai-llm-testing.md`](/concepts/ai-llm-testing) + [migration guide](/migrations/v1.11-to-v1.12)

See the [Roadmap](https://github.com/cardene777/kiwa#roadmap) for full milestone details.

## Roadmap

| Milestone | Status | Focus |
|---|---|---|
| v1.9 | ✅ | Multi-provider baseline |
| v1.10 | ✅ | Supabase Auth + RabbitMQ + Rust contract layer |
| v1.11 | ✅ | Quality metrics harness + dogfood app pattern + GitHub Pages |
| v1.12 | ✅ 6/6 | AI-LLM axis expansion — 11-axis release gate + `@kiwa-test/ai-llm` + 3 dogfood apps |
