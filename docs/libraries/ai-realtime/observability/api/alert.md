---
title: "@kiwa-lab/observability alert の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>alert</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>AlertRouter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L82) <code v-pre>packages/observability/src/alert.ts</code>

Prometheus AlertManager style alert router + rule engine + silence store + escalation state machine, glued to a TelemetryCollector.

```ts
/**
 * Prometheus AlertManager style alert router + rule engine + silence
 * store + escalation state machine, glued to a TelemetryCollector.
 */
export declare class AlertRouter {
    constructor(collector: TelemetryCollector, options?: {
        now?: () => number;
    });
    registerRule(rule: AlertRule): void;
    setRoute(route: RouteEntry): void;
    addSilence(silence: Silence): void;
    setEscalation(ruleId: string, steps: EscalationStep[]): void;
    /**
     * Evaluate every registered rule against the current collector
     * state. Rules whose predicate holds continuously for `forSamples`
     * evaluations transition pending → firing and are routed. Rules
     * whose predicate flips back to false transition to resolved.
     */
    evaluate(): AlertReceiverEvent[];
    /**
     * Advance the escalation clock. Any active fire whose escalation
     * step's `afterMs` has elapsed since firedAt gets routed to the
     * escalation receiver and transitions firing → escalated.
     */
    tickEscalation(): AlertReceiverEvent[];
    getDeliveries(): AlertReceiverEvent[];
    getActive(): AlertFire[];
}
```

#### <code v-pre>metricsForRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L282) <code v-pre>packages/observability/src/alert.ts</code>

Convenience — narrow accessor: metric records for a metric name. Kept exported so kiwa test scenarios can double-check assertion denominators without duplicating the filter predicate.

```ts
export declare function metricsForRule(collector: TelemetryCollector, rule: AlertRule): MetricRecord[];
```

### 型

#### <code v-pre>AlertFire</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L34) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export interface AlertFire {
    ruleId: string;
    severity: AlertSeverity;
    labels: Record<string, string>;
    value: number;
    firedAt: number;
    state: AlertState;
}
```

#### <code v-pre>AlertOperator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L14) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export type AlertOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
```

#### <code v-pre>AlertReceiverEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L71) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export interface AlertReceiverEvent {
    receiver: string;
    fire: AlertFire;
    reason: 'route' | 'escalation';
    deliveredAt: number;
}
```

#### <code v-pre>AlertRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L20) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export interface AlertRule {
    id: string;
    metricName: string;
    operator: AlertOperator;
    threshold: number;
    /**
     * Sample count required over which the operator must hold before
     * the rule transitions from pending → firing. Default: 1.
     */
    forSamples?: number;
    labels: Record<string, string>;
    severity: AlertSeverity;
}
```

#### <code v-pre>AlertSeverity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L16) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export type AlertSeverity = 'info' | 'warn' | 'critical';
```

#### <code v-pre>AlertState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L18) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export type AlertState = 'pending' | 'firing' | 'escalated' | 'resolved';
```

#### <code v-pre>EscalationStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L65) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export interface EscalationStep {
    /** Milliseconds after firing before this step applies. */
    afterMs: number;
    receiver: string;
}
```

#### <code v-pre>RouteEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L43) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export interface RouteEntry {
    /**
     * Label match — all key/value pairs must be present on the fire's
     * labels for the entry to be considered.
     */
    match: Record<string, string>;
    receiver: string;
    /**
     * Nested routes are evaluated when the parent match holds; the
     * first nested match that satisfies wins over the parent (deepest
     * match wins). Nested routes without a match are treated as a
     * catch-all inside the parent branch.
     */
    routes?: RouteEntry[];
}
```

#### <code v-pre>Silence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L59) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export interface Silence {
    id: string;
    match: Record<string, string>;
    expiresAt: number;
}
```
