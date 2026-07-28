---
title: "@kiwa-lab/observability fixtures の API 契約"
---

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>fixtures</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>defaultRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L119) <code v-pre>packages/observability/src/fixtures.ts</code>

Alert routing tree — deepest match wins.

```ts
export declare function defaultRoute(): RouteEntry;
```

#### <code v-pre>escalation&#95;pagerDutyTwoStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L142) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function escalation_pagerDutyTwoStep(): EscalationStep[];
```

#### <code v-pre>logs&#95;forHttpTrace</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L280) <code v-pre>packages/observability/src/fixtures.ts</code>

Log correlation fixture — matched log lines for the http handler trace. Timestamps sit inside the parent span window so join by timestamp bucket also works for callers that do not carry ids.

```ts
export declare function logs_forHttpTrace(startAt?: number): LogRecord[];
```

#### <code v-pre>panel&#95;httpErrorRate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L29) <code v-pre>packages/observability/src/fixtures.ts</code>

Dashboard panel builders — 3 named scenarios covering the common SaaS observability wall.

```ts
export declare function panel_httpErrorRate(id?: string): PanelConfig;
```

#### <code v-pre>panel&#95;p99Latency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L46) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function panel_p99Latency(id?: string): PanelConfig;
```

#### <code v-pre>panel&#95;queueDepth</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L63) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function panel_queueDepth(id?: string, queue?: string): PanelConfig;
```

#### <code v-pre>rule&#95;errorRateCritical</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L80) <code v-pre>packages/observability/src/fixtures.ts</code>

Alert rule builders — 3 named scenarios matching the panel wall.

```ts
export declare function rule_errorRateCritical(id?: string): AlertRule;
```

#### <code v-pre>rule&#95;latencyDegraded</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L92) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function rule_latencyDegraded(id?: string): AlertRule;
```

#### <code v-pre>rule&#95;queueBackpressure</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L104) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function rule_queueBackpressure(id?: string, queue?: string): AlertRule;
```

#### <code v-pre>silence&#95;maintenanceWindow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L149) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function silence_maintenanceWindow(id: string, minutesFromNow: number, now: number): Silence;
```

#### <code v-pre>trace&#95;fanoutParallel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L191) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function trace_fanoutParallel(startAt?: number): SpanRecord[];
```

#### <code v-pre>trace&#95;httpHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L161) <code v-pre>packages/observability/src/fixtures.ts</code>

Trace scenario builders — 3 named span shapes covering the common SUT flame graph patterns.

```ts
export declare function trace_httpHandler(startAt?: number): SpanRecord[];
```

#### <code v-pre>trace&#95;nestedRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L229) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function trace_nestedRetry(startAt?: number): SpanRecord[];
```


