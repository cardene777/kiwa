# @kiwa-lab/observability

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package closes the loop with coverage / flaky detection / dashboard)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package powers the coverage / review step shown in the video. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Observability adapter for kiwa — close the loop between Layer 1 spec, Layer 2 test code, and runtime results.

## Overview

`@kiwa-lab/observability` provides the bottom of the design × implementation × observability loop:

- `collectRunHistory({ history, records, maxPerTest })` — append vitest-style runs to a history, with FIFO eviction.
- `fromVitestJson(report, { runId })` — convert a vitest JSON reporter blob into `TestRunRecord[]`, extracting `T-XXX-NNN` IDs from the test names.
- `detectFlaky({ history, minRuns, threshold })` — find tests with mixed pass/fail outcomes across runs.
- `analyzeSpecCoverage({ specMarkdown, testCode })` — compare spec TC IDs with `it('T-XXX-NNN ...')` strings in test code and surface gaps both ways.
- `renderDashboard({ history, flaky, gaps })` — print a markdown dashboard suitable for PR comments, README badges, or `decisions/` archives.

### v1.1 — telemetry provider mocks

- `createOtelMock()` / `createDatadogMock()` / `createSentryMock()` — in-memory mock for OpenTelemetry / Datadog / Sentry SDKs, all writing into a shared `TelemetryCollector` shape (spans / metrics / logs / exceptions / transactions).

### v2.0 — runtime observability axes

Four additional axes for asserting on runtime SaaS observability output during kiwa tests:

- `DashboardMock` / `buildDashboardMock` — Grafana-style dashboard with N panels. Each panel runs a `MetricQuery` (`sum` / `avg` / `max` / `min` / `count` / `last`, optional `tagFilter` + time window) against a `TelemetryCollector.metrics` sink; optional `PanelThreshold[]` selects an `ok` / `warn` / `critical` badge. `refresh()` re-queries and increments `refreshCount`.
- `AlertRouter` — Prometheus AlertManager style rule engine. Register `AlertRule[]`, walk a nested `RouteEntry` tree (deepest match wins), suppress with `Silence`, escalate with `setEscalation` + `tickEscalation` state machine (pending → firing → escalated → resolved).
- `buildSpanTree` + `renderFlameGraph` + `drillDown` + `flattenFlame` — pure transforms over `SpanRecord[]` that rebuild parent chains, compute `totalMs` / `selfMs`, collapse siblings by name into `FlameNode`, and extract a subtree by name.
- `LogCorrelationIndex` / `correlateLogsAndSpans` — bidirectional index over `LogRecord[]` + `SpanRecord[]`, keyed by `trace_id` / `span_id` attributes (configurable, with `altTraceIdKeys` fallback for Datadog / Sentry conventions).

Named fixture builders (`panel_httpErrorRate` / `rule_errorRateCritical` / `trace_httpHandler` / `logs_forHttpTrace` etc.) let test authors bootstrap a realistic scenario in one call.

## Install

```bash
pnpm add -D @kiwa-lab/observability @kiwa-lab/core vitest
```

## Quick start

```ts
import {
  analyzeSpecCoverage,
  collectRunHistory,
  detectFlaky,
  fromVitestJson,
  renderDashboard,
} from "@kiwa-lab/observability";
import { readFile } from "node:fs/promises";

const vitestReport = JSON.parse(await readFile("vitest-results.json", "utf8"));
const records = fromVitestJson(vitestReport, { runId: "ci-42" });
const history = collectRunHistory({ records, maxPerTest: 20 });

const flaky = detectFlaky({ history, minRuns: 3, threshold: 0.1 });

const specMd = await readFile("tests/spec/integration/test-spec-items.api.md", "utf8");
const testCode = await readFile("tests/items.test.ts", "utf8");
const gaps = [analyzeSpecCoverage({ specMarkdown: specMd, testCode })];

const dashboard = renderDashboard({ history, flaky, gaps });
console.log(dashboard);
```

## License

MIT
