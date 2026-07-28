---
title: "@kiwa-lab/edge semantics__global-routing の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics&#95;&#95;global-routing</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>markUnhealthy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L167) <code v-pre>packages/edge/src/semantics/global-routing.ts</code>

Mark a POP unhealthy (e.g. probe failed). Later selectByLatency calls will skip it.

```ts
export declare function markUnhealthy(session: RoutingSession, input: {
    popId: string;
}): void;
```

#### <code v-pre>matchGeo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L70) <code v-pre>packages/edge/src/semantics/global-routing.ts</code>

Match request geo to a region. Returns POPs in that region (empty if none). Emits `routing.geo-matched` with match count.

```ts
export declare function matchGeo(session: RoutingSession, input: {
    requestId: string;
    region: string;
}): AxisStep<RoutingState>;
```

#### <code v-pre>receiveAnycast</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L48) <code v-pre>packages/edge/src/semantics/global-routing.ts</code>

Receive an Anycast request at the network edge. Emits `routing.anycast-received` and returns the initial state.

```ts
export declare function receiveAnycast(session: RoutingSession, input: {
    requestId: string;
}): AxisStep<RoutingState>;
```

#### <code v-pre>selectByLatency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L97) <code v-pre>packages/edge/src/semantics/global-routing.ts</code>

Select the lowest-latency healthy POP. If no healthy POP exists, emits `routing.failover-triggered` and returns the healthiest fallback (accepting some latency penalty).

```ts
export declare function selectByLatency(session: RoutingSession, input: {
    requestId: string;
    preferredRegion?: string;
}): AxisStep<RoutingState>;
```

#### <code v-pre>startRoutingPool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L29) <code v-pre>packages/edge/src/semantics/global-routing.ts</code>

Open a routing session with a POP pool. Each POP has a region tag, measured latency, and health flag.

```ts
export declare function startRoutingPool(input: {
    platform: EdgePlatform;
    pops: Pop[];
}): RoutingSession;
```

### 型

#### <code v-pre>Pop</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L12) <code v-pre>packages/edge/src/semantics/global-routing.ts</code>

```ts
export interface Pop {
    popId: string;
    region: string;
    latencyMs: number;
    healthy: boolean;
}
```

#### <code v-pre>RoutingSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L19) <code v-pre>packages/edge/src/semantics/global-routing.ts</code>

```ts
export interface RoutingSession {
    platform: EdgePlatform;
    pops: Map<string, Pop>;
    history: AxisStep<RoutingState>[];
}
```

#### <code v-pre>RoutingState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L10) <code v-pre>packages/edge/src/semantics/global-routing.ts</code>

Global routing axis — Anycast + geo + latency-based failover. Edge platforms receive requests on Anycast IPs and route them to the closest healthy POP based on geo match, then latency probe, then failover if the primary POP is unhealthy. The helper tracks POP health + observed latencies so tests can drive the routing decision tree.

```ts
export type RoutingState = 'anycast' | 'geo-matched' | 'latency-selected' | 'failing-over';
```
