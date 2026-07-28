---
title: "@kiwa-lab/observability log-correlation の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>log-correlation</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>correlateLogsAndSpans</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L162) <code v-pre>packages/observability/src/log-correlation.ts</code>

Sugar for the common case: build an index over the entire collector state.

```ts
export declare function correlateLogsAndSpans(input: {
    logs: LogRecord[];
    spans: SpanRecord[];
}, keys?: CorrelationKeys): LogCorrelationIndex;
```

#### <code v-pre>LogCorrelationIndex</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L42) <code v-pre>packages/observability/src/log-correlation.ts</code>

Bidirectional index over the collector's logs / spans sinks. The index is built once from the current collector state; callers who mutate the collector after building must rebuild.

```ts
/**
 * Bidirectional index over the collector's logs / spans sinks. The
 * index is built once from the current collector state; callers who
 * mutate the collector after building must rebuild.
 */
export declare class LogCorrelationIndex {
    constructor(input: {
        logs: LogRecord[];
        spans: SpanRecord[];
    }, keys?: CorrelationKeys);
    /**
     * Logs whose spanId attribute equals the given span id.
     */
    logsForSpan(spanId: string): LogRecord[];
    /**
     * Logs whose traceId attribute equals the given trace id (across
     * every span in the trace).
     */
    logsForTrace(traceId: string): LogRecord[];
    /**
     * Spans in the given trace, insertion order.
     */
    spansForTrace(traceId: string): SpanRecord[];
    /**
     * Convenience — return every log with the span it joins to, or
     * null when the log carries no correlatable id.
     */
    linkAll(): LogSpanLink[];
    /**
     * Count logs that carry at least one correlatable id. Useful for
     * kiwa tests that measure the SUT's instrumentation coverage of
     * its own log surface.
     */
    correlatedCount(): number;
}
```

### 型

#### <code v-pre>CorrelationKeys</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L20) <code v-pre>packages/observability/src/log-correlation.ts</code>

Attribute keys used to look up trace / span ids on both sides. Callers can override for SDKs that use different key conventions (OpenTelemetry canonical is `trace_id` / `span_id`, Datadog is `dd.trace_id`, Sentry is `sentry-trace`).

```ts
export interface CorrelationKeys {
    traceIdKey?: string;
    spanIdKey?: string;
    /**
     * Fallback trace key checked when `traceIdKey` is not present.
     * Useful when the SUT mixes conventions during a migration.
     */
    altTraceIdKeys?: string[];
}
```

#### <code v-pre>LogSpanLink</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L30) <code v-pre>packages/observability/src/log-correlation.ts</code>

```ts
export interface LogSpanLink {
    log: LogRecord;
    span: SpanRecord | null;
    traceId: string | null;
    spanId: string | null;
}
```
