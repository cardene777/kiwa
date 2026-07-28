---
title: "@kiwa-lab/edge semantics-d1-read-replica の API 契約"
---

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics-d1-read-replica</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>readFromReplica</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L77) <code v-pre>packages/edge/src/semantics/d1-read-replica.ts</code>

Route a read. Picks the healthiest replica in the given region (or any healthy replica if region has none), or falls back to primary if all replicas are unhealthy. Emits `d1.replica-read` on success, `d1.replica-failover` on fallback.

```ts
export declare function readFromReplica(session: D1Session, input: {
    query: string;
    preferredRegion?: string;
}): AxisStep<D1RoutingState>;
```

#### <code v-pre>reportLag</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L124) <code v-pre>packages/edge/src/semantics/d1-read-replica.ts</code>

Report replica lag observed (e.g. from replication log). If lag exceeds threshold, marks replica unhealthy and emits `d1.replica-lagged`.

```ts
export declare function reportLag(session: D1Session, input: {
    replicaId: string;
    lagMs: number;
}): AxisStep<D1RoutingState>;
```

#### <code v-pre>startD1</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L31) <code v-pre>packages/edge/src/semantics/d1-read-replica.ts</code>

Open a D1 session with primary + replica pool. `maxLagMs` is the threshold above which a replica is considered unhealthy and failover kicks in.

```ts
export declare function startD1(input: {
    platform: EdgePlatform;
    primaryId: string;
    replicas?: Omit<D1Replica, 'healthy'>[];
    maxLagMs?: number;
}): D1Session;
```

#### <code v-pre>writeToPrimary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L53) <code v-pre>packages/edge/src/semantics/d1-read-replica.ts</code>

Route a write to primary. Emits `d1.primary-write`.

```ts
export declare function writeToPrimary(session: D1Session, input: {
    query: string;
}): AxisStep<D1RoutingState>;
```

### 型

#### <code v-pre>D1Replica</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L11) <code v-pre>packages/edge/src/semantics/d1-read-replica.ts</code>

```ts
export interface D1Replica {
    replicaId: string;
    region: string;
    lagMs: number;
    healthy: boolean;
}
```

#### <code v-pre>D1RoutingState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L9) <code v-pre>packages/edge/src/semantics/d1-read-replica.ts</code>

D1 read replica axis — primary-replica database routing. Writes always land on primary, reads route to nearest replica unless lag exceeds threshold, in which case failover to primary. The helper tracks per-replica lag (in milliseconds behind primary) and routing decisions.

```ts
export type D1RoutingState = 'primary' | 'replica' | 'lagged' | 'failing-over';
```

#### <code v-pre>D1Session</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L18) <code v-pre>packages/edge/src/semantics/d1-read-replica.ts</code>

```ts
export interface D1Session {
    platform: EdgePlatform;
    primaryId: string;
    replicas: Map<string, D1Replica>;
    maxLagMs: number;
    history: AxisStep<D1RoutingState>[];
}
```
