1/ kiwa v1.14 is out — 横軸拡張 milestone. After 3 縦軸 releases (v1.11 release gate → v1.12 non-determinism → v1.13 time-axis), v1.14 fills 4 SaaS provider gaps + finishes perf coverage across all 9 kiwa targets.

2/ `@kiwa-lab/payment` v0.1 — Stripe + Paddle + Lemon Squeezy webhook mock. HMAC-SHA256 sign + timing-safe verify + 4 fixture builders. Provider payload diff SSOT (Stripe data.object / Paddle data.attributes / Lemon Squeezy meta.event_name) built in.

3/ `@kiwa-lab/search` v0.1 — Meilisearch + Algolia + Typesense in-memory mock. Word-overlap ranking + filter + facet + sort + 1-edit-distance typo tolerance. Per-provider typo default matches production (Meili/Algolia on, Typesense off).

4/ `@kiwa-lab/observability` v1.1 — 3 telemetry mocks added (OpenTelemetry + Datadog + Sentry). Unified `TelemetryCollector` shape so tests assert once regardless of provider. Sentry fingerprint dedupe + breadcrumb lifecycle match the real SDK.

5/ `kiwa-test-go` v0.5 — Iris + Chi subpackage. kiwa now covers 5 Go web frameworks (gin / echo / fiber / iris / chi) under one `TestServer` contract. Same in-process ServeHTTP driver, no port binding, no TIME_WAIT.

6/ perf-harness 実測完遂 — v1.13-1 landed the harness with 5 targets. v1.14-1 extends to 9 (realtime + 3 realtime dogfood apps added). All 9 targets emit p95 reports + PASS the release gate.

7/ Roadmap: https://github.com/cardene777/kiwa/issues/724 — v1.15+ candidates: Reth (Rust Ethereum), Dragonfly (Redis-alt), Storybook, AI-LLM depth (multimodal / MCP / agent), framework depth (SolidJS / Fresh / HonoJS).
