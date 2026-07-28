---
title: "@kiwa-lab/observability dashboard-mock の API 契約"
---

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>dashboard-mock</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildDashboardMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L214) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

Builder helper — construct a DashboardMock from an already-populated collector plus a panel list. Sugar for the common test setup.

```ts
export declare function buildDashboardMock(input: {
    id: string;
    title: string;
    panels: PanelConfig[];
    collector: TelemetryCollector;
    now?: () => number;
}): DashboardMock;
```

#### <code v-pre>DashboardMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L73) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

Grafana-style dashboard mock. A single dashboard binds to a single TelemetryCollector and re-queries metrics on each `refresh()` call.

```ts
/**
 * Grafana-style dashboard mock. A single dashboard binds to a single
 * TelemetryCollector and re-queries metrics on each `refresh()` call.
 */
export declare class DashboardMock {
    readonly id: string;
    readonly title: string;
    constructor(config: DashboardConfig, collector: TelemetryCollector, options?: {
        now?: () => number;
    });
    /**
     * Re-execute every panel query against the current collector state.
     * Returns the new panel results and increments refreshCount.
     */
    refresh(): PanelResult[];
    /**
     * Number of times refresh() has been called since construction.
     */
    getRefreshCount(): number;
    /**
     * The most recent set of panel results (empty array before first
     * refresh call).
     */
    getLastResults(): PanelResult[];
    /**
     * Convenience accessor by panel id from the most recent results.
     */
    panel(panelId: string): PanelResult | undefined;
}
```

### 型

#### <code v-pre>DashboardConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L63) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

```ts
export interface DashboardConfig {
    id: string;
    title: string;
    panels: PanelConfig[];
}
```

#### <code v-pre>MetricAggregation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L18) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

```ts
export type MetricAggregation = 'sum' | 'avg' | 'max' | 'min' | 'count' | 'last';
```

#### <code v-pre>MetricQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L20) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

```ts
export interface MetricQuery {
    metricName: string;
    aggregation: MetricAggregation;
    /**
     * Optional tag filter. All tag key/value pairs must match on a
     * MetricRecord for it to enter the aggregation.
     */
    tagFilter?: Record<string, string>;
    /**
     * Optional time window. `sinceMs` and `untilMs` bound the
     * MetricRecord.timestamp against the collector clock.
     */
    sinceMs?: number;
    untilMs?: number;
}
```

#### <code v-pre>PanelConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L45) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

```ts
export interface PanelConfig {
    id: string;
    title: string;
    kind: PanelKind;
    query: MetricQuery;
    thresholds?: PanelThreshold[];
}
```

#### <code v-pre>PanelKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L16) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

```ts
export type PanelKind = 'stat' | 'timeseries' | 'gauge' | 'table';
```

#### <code v-pre>PanelResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L53) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

```ts
export interface PanelResult {
    panelId: string;
    title: string;
    kind: PanelKind;
    value: number;
    matchedRecords: number;
    badge: PanelThreshold['label'] | null;
    refreshedAt: number;
}
```

#### <code v-pre>PanelThreshold</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L36) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

```ts
export interface PanelThreshold {
    /** Comparison operator against the aggregated numeric result. */
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
    /** Threshold value; result compared with `operator` decides badge. */
    value: number;
    /** Badge label emitted when the comparison is true. */
    label: 'ok' | 'warn' | 'critical';
}
```
