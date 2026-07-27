# Observability を使う

`@kiwa-lab/observability` は外部 backend の動作を証明するものではありません。テスト実行履歴、仕様 ID、application が出した span、metric、log を同じ test の中で観測し、CI や運用画面へ渡す前の契約を固定します。この page では flaky 判定、spec coverage、OpenTelemetry 形式の記録、trace と log の対応を一つの file で確認します。

## CI と application の記録を確認する

`tests/observability.test.ts` を作り、次の内容を保存します。

```ts
import {
  analyzeSpecCoverage,
  collectRunHistory,
  correlateLogsAndSpans,
  createOtelMock,
  detectFlaky,
  logs_forHttpTrace,
  renderDashboard,
  trace_httpHandler,
} from "@kiwa-lab/observability";
import { describe, expect, it } from "vitest";

describe("observability recipes", () => {
  it("classifies mixed pass and failure history as flaky", () => {
    const history = collectRunHistory({
      records: [
        {
          testId: "T-API-001",
          fullName: "T-API-001 returns a user",
          status: "passed",
          durationMs: 12,
          runId: "ci-1",
          startedAt: 1,
        },
        {
          testId: "T-API-001",
          fullName: "T-API-001 returns a user",
          status: "failed",
          durationMs: 8,
          runId: "ci-2",
          startedAt: 2,
        },
      ],
      maxPerTest: 20,
    });

    expect(detectFlaky({ history, minRuns: 2, threshold: 0.1 })).toMatchObject([
      { testId: "T-API-001", failureRate: 0.5 },
    ]);
  });

  it("renders a missing specification case in the dashboard", () => {
    const gap = analyzeSpecCoverage({
      specMarkdown:
        "# test-spec-users (api layer)\n\n- module: users\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-API-001 | user | a | b | c | P0 | yes | mock | /users |\n| T-API-002 | invalid | a | b | c | P0 | yes | mock | /users |",
      testCode: "it('T-API-001 returns a user', () => {})",
      module: "users",
      defaultLayer: "api",
    });
    const dashboard = renderDashboard({
      history: collectRunHistory({ records: [] }),
      flaky: [],
      gaps: [gap],
    });

    expect(gap.missingTcIds).toEqual(["T-API-002"]);
    expect(dashboard).toContain("T-API-002");
  });

  it("collects application spans metrics and logs without an external backend", () => {
    const otel = createOtelMock();
    const span = otel.tracer.startSpan("handle-request", {
      attributes: { route: "/api/users" },
    });
    otel.meter.createCounter("requests.total").add(1, { route: "/api/users" });
    otel.logger.emit({
      level: "info",
      message: "request complete",
      attributes: { status: 200 },
    });
    span.end();

    expect(otel.collector.spanByName("handle-request")?.attributes.route).toBe("/api/users");
    expect(otel.collector.metricSum("requests.total")).toBe(1);
    expect(otel.collector.logs[0]).toMatchObject({
      level: "info",
      message: "request complete",
    });
  });

  it("joins logs and spans that have the same trace ID", () => {
    const index = correlateLogsAndSpans({
      logs: logs_forHttpTrace(),
      spans: trace_httpHandler(),
    });

    expect(index.logsForTrace("trace-http-handler")).toHaveLength(4);
    expect(index.spansForTrace("trace-http-handler")).toHaveLength(3);
  });
});
```

## 実行する

```bash
pnpm exec vitest run tests/observability.test.ts
```

flaky 判定は skipped を数えず、最低実行回数を満たし、成功と失敗が混在し、failure rate が threshold 以上の test だけを返します。常に失敗する test は flaky ではなく恒常的な failure として扱います。履歴は戻り値の in-memory data だけです。次の CI run でも比較する場合は、呼び出し側で serialize して保存します。

spec coverage は spec Markdown と test code に含まれる `T-` 形式の ID を照合します。test が実行されたことや assertion の品質は判定しません。dashboard に missing ID が出たら、test を追加するか、仕様から削除するかをレビューして決めます。ID を文字列として置くだけで coverage を通してはいけません。

`createOtelMock` は application が記録した span、metric、log を collector に保持します。trace ID を持たない log は trace に結び付かないため、相関させたい log と span は同じ trace ID を記録します。metric 名、route attribute、log level のように、実際に alert や dashboard の条件になる値を assertion にしてください。

## 実サービスへ渡す確認

この library は Grafana、Prometheus、Loki、OpenTelemetry collector、Datadog、Sentry へ自動送信しません。exporter の認証、backend retention、sampling、alert delivery、実 query の確認は endpoint と credential を明示した integration test で行います。`buildRealDriverConfig` は接続設定を組み立てる helper であり、backend client ではありません。

flaky が期待どおりに出ない場合は、同じ test ID で十分な pass と fail の履歴があるか、skipped だけになっていないか、`minRuns` と `threshold` が目的に合うかを確認します。spec gap が空の場合は、spec Markdown が必要な header と ID column を持つか、test code 内の ID が正しい形式かを確認してください。
