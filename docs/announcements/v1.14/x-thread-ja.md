1/ kiwa v1.14 released。 横軸拡張 milestone です。 3 縦軸 (v1.11 release gate → v1.12 非決定性 → v1.13 時間軸) 連続完遂後、 v1.14 は SaaS 実運用の必須 4 provider を追加 + 全 9 kiwa target で perf 実測を完遂しました。

2/ `@kiwa-lab/payment` v0.1 — Stripe + Paddle + Lemon Squeezy webhook mock。 HMAC-SHA256 sign + timing-safe verify + 4 fixture builder。 3 provider の payload 差 (Stripe data.object / Paddle data.attributes / Lemon Squeezy meta.event_name) は engine config で吸収。

3/ `@kiwa-lab/search` v0.1 — Meilisearch + Algolia + Typesense in-memory search mock。 word-overlap ranking + filter + facet + sort + 1-edit-distance typo tolerance。 provider 別 typo default が real の production default と一致 (Meili/Algolia ON / Typesense OFF)。

4/ `@kiwa-lab/observability` v1.1 — telemetry mock 3 provider 追加 (OpenTelemetry + Datadog + Sentry)。 `TelemetryCollector` 共通 shape で 3 provider を統一。 Sentry fingerprint dedupe + breadcrumb lifecycle は real SDK と一致。

5/ `kiwa-test-go` v0.5 — Iris + Chi subpackage 追加。 kiwa が 5 Go web framework (gin / echo / fiber / iris / chi) を 1 `TestServer` contract で cover。 in-process ServeHTTP driver で port bind / TIME_WAIT 不要。

6/ perf-harness 実測完遂 — v1.13-1 で 5 target land、 v1.14-1 で 9 target に拡張 (realtime + dogfood 3 realtime 追加)。 全 9 target が p95 report emit + release gate PASS 状態。

7/ Roadmap: https://github.com/cardene777/kiwa/issues/724 — v1.15+ 候補 = Reth (Rust Ethereum) / Dragonfly (Redis 互換) / Storybook / AI-LLM 深化 (multimodal / MCP / agent) / framework 深化 (SolidJS / Fresh / HonoJS)。
