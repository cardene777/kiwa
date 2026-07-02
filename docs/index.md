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
  - title: 5-axis release gate
    details: coverage + test count + fidelity + perf p95 + mutation kill rate. Each provider reports the same shape. Release when the gate says PASS.
  - title: Real-vs-mock dogfood
    details: Every provider has an example that runs against the real service AND against the kiwa mock. Divergences feed the fidelity axis of the release gate.
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

**v1.11 — quality gate augmentation** (2026-07-02). See the [Roadmap](https://github.com/cardene777/kiwa#roadmap) for full milestone details.
