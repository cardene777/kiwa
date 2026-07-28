---
title: "@kiwa-lab/observability telemetry の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>telemetry</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createDatadogMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L191) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export declare function createDatadogMock(config?: {
    now?: () => number;
}): DatadogMock;
```

#### <code v-pre>createOtelMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L113) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export declare function createOtelMock(config?: {
    now?: () => number;
}): OtelMock;
```

#### <code v-pre>createSentryMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L245) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export declare function createSentryMock(config?: {
    now?: () => number;
}): SentryMock;
```

#### <code v-pre>TelemetryCollector</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L63) <code v-pre>packages/observability/src/telemetry.ts</code>

Shared collector — every provider mock writes into the same shape so kiwa tests can assert once regardless of provider chosen.

```ts
export declare class TelemetryCollector {
    readonly spans: SpanRecord[];
    readonly metrics: MetricRecord[];
    readonly logs: LogRecord[];
    readonly exceptions: ExceptionRecord[];
    readonly transactions: TransactionRecord[];
    clear(): void;
    spanByName(name: string): SpanRecord | undefined;
    metricSum(name: string): number;
    hasException(fingerprint: string): boolean;
}
```

### 型

#### <code v-pre>DatadogMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L174) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export interface DatadogMock {
    readonly provider: 'datadog';
    readonly collector: TelemetryCollector;
    statsd: {
        increment(name: string, value?: number, tags?: Record<string, string>): void;
        gauge(name: string, value: number, tags?: Record<string, string>): void;
        histogram(name: string, value: number, tags?: Record<string, string>): void;
    };
    tracer: {
        startSpan(name: string, options?: {
            tags?: Record<string, string>;
            childOf?: string;
        }): {
            addTags(tags: Record<string, string>): void;
            log(fields: Record<string, unknown>): void;
            finish(): void;
        };
    };
}
```

#### <code v-pre>ExceptionRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L42) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export interface ExceptionRecord {
    message: string;
    fingerprint: string;
    stack: string | null;
    breadcrumbs: Array<{
        category: string;
        message: string;
        level: string;
        timestamp: number;
    }>;
    tags: Record<string, string>;
    timestamp: number;
}
```

#### <code v-pre>LogRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L35) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export interface LogRecord {
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    attributes: Record<string, unknown>;
    timestamp: number;
}
```

#### <code v-pre>MetricRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L27) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export interface MetricRecord {
    name: string;
    kind: 'counter' | 'gauge' | 'histogram';
    value: number;
    tags: Record<string, string>;
    timestamp: number;
}
```

#### <code v-pre>OtelMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L93) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export interface OtelMock {
    readonly provider: 'otel';
    readonly collector: TelemetryCollector;
    tracer: {
        startSpan(name: string, options?: {
            attributes?: Record<string, unknown>;
            parent?: string;
        }): {
            addEvent(name: string, attributes?: Record<string, unknown>): void;
            setAttribute(key: string, value: unknown): void;
            end(): void;
        };
    };
    meter: {
        createCounter(name: string): {
            add(value: number, tags?: Record<string, string>): void;
        };
        createGauge(name: string): {
            record(value: number, tags?: Record<string, string>): void;
        };
        createHistogram(name: string): {
            record(value: number, tags?: Record<string, string>): void;
        };
    };
    logger: {
        emit(record: Omit<LogRecord, 'timestamp'>): void;
    };
}
```

#### <code v-pre>SentryMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L235) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export interface SentryMock {
    readonly provider: 'sentry';
    readonly collector: TelemetryCollector;
    captureException(err: Error | {
        message: string;
        stack?: string;
    }, options?: {
        tags?: Record<string, string>;
    }): string;
    addBreadcrumb(input: {
        category: string;
        message: string;
        level?: string;
    }): void;
    startTransaction(input: {
        name: string;
        op: string;
        tags?: Record<string, string>;
    }): {
        finish(): void;
    };
}
```

#### <code v-pre>SpanRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L18) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export interface SpanRecord {
    name: string;
    attributes: Record<string, unknown>;
    startedAt: number;
    endedAt: number | null;
    parentSpanName: string | null;
    events: Array<{
        name: string;
        attributes: Record<string, unknown>;
        timestamp: number;
    }>;
}
```

#### <code v-pre>TelemetryProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L16) <code v-pre>packages/observability/src/telemetry.ts</code>

Telemetry provider mock — v0.2 addition (v1.14-4). Adds unified in-memory collectors for the 3 major APM / error providers: - OpenTelemetry (span / metric / log) - Datadog (StatsD gauge/increment/histogram + tracer.startSpan) - Sentry (captureException / addBreadcrumb / startTransaction) The v1.0 observability API (flaky + spec coverage) targets test-run analysis. This module targets application telemetry emitted during test execution so kiwa tests can assert "the SUT emitted span X", "the metric counter incremented", or "the exception was captured with fingerprint Y".

```ts
export type TelemetryProvider = 'otel' | 'datadog' | 'sentry';
```

#### <code v-pre>TransactionRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L51) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export interface TransactionRecord {
    name: string;
    operation: string;
    startedAt: number;
    endedAt: number | null;
    tags: Record<string, string>;
}
```
