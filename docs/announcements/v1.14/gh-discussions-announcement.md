# kiwa v1.14 released — Payment + Search + Telemetry + Go Iris/Chi (横軸拡張)

v1.14 is out. After 3 縦軸 milestones (v1.11 release gate → v1.12 non-determinism → v1.13 time-axis), v1.14 pivots to **横軸拡張** — adding the 4 SaaS provider categories that were on the v1.11+ backlog and completing perf measurement across all 9 kiwa targets.

## What shipped

- **`@kiwa-lab/payment` v0.1** — Stripe + Paddle + Lemon Squeezy webhook mock. HMAC-SHA256 signature verify with timing-safe compare, 4 fixture builders (`checkoutCompleted` / `subscriptionCreated` / `paymentFailed` / `refunded`), handler dispatch for e2e webhook flows.
- **`@kiwa-lab/search` v0.1** — Meilisearch + Algolia + Typesense in-memory search mock. Word-overlap ranking, filter / facet / sort / pagination, 1-edit-distance typo tolerance (default matches each provider's production default).
- **`@kiwa-lab/observability` v1.1** — 3 new telemetry mocks (OpenTelemetry + Datadog + Sentry). Unified `TelemetryCollector` shape (spans / metrics / logs / exceptions / transactions) so assertions read the same regardless of provider chosen.
- **`kiwa-test-go` v0.5** — Iris + Chi subpackage. Same `TestServer` contract as v1.5+ gin / echo / fiber. Kiwa now covers **5 Go web frameworks** in one polyglot skill.
- **perf 実測完遂** — v1.13-1 landed the perf-harness with 5 targets. v1.14-1 extends to **9 targets** (added realtime + 3 realtime dogfood apps). All targets emit p95 reports under `docs/quality-reports/perf/` and pass the release gate.

## Numbers

- **6 sub-Issues resolved** (#722 + #725-#729)
- **6 PRs merged** (#723 + #730-#733 + #729-parent close)
- **4 new packages / expansions** (payment / search / observability v1.1 / go v0.5)
- **9 perf targets** with real p95 measurements + release-gate PASS

## v1.15+ candidates

- Reth (Rust Ethereum execution client, dApp testing depth)
- Dragonfly (Redis-compatible modern cache)
- Storybook integration
- AI-LLM depth (multimodal / MCP tool / agent orchestration)
- Framework depth (SolidJS, Fresh, HonoJS)

Feedback welcome on which of these should land next.
