---
title: "@kiwa-lab/edge semantics__geo-replicated の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics&#95;&#95;geo-replicated</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createGeoReplicatedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L46) <code v-pre>packages/edge/src/semantics/geo-replicated.ts</code>

Construct a geo-replicated session. Starts 'in-sync' at version 0 with every replica at zero lag. No event is emitted.

```ts
export declare function createGeoReplicatedSession(input: {
    platform: EdgePlatform;
    primaryRegion: GeoRegion;
    replicaRegions: GeoRegion[];
}): GeoReplicatedSession;
```

#### <code v-pre>geoPrimaryWrite</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L69) <code v-pre>packages/edge/src/semantics/geo-replicated.ts</code>

Write to the primary region. Bumps the version and marks every replica as lagging (they have not yet received the new version). Emits `geo.primary-write`.

```ts
export declare function geoPrimaryWrite(session: GeoReplicatedSession, input: {
    data: string;
}): AxisStep<GeoState>;
```

#### <code v-pre>markReplicaLagged</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L89) <code v-pre>packages/edge/src/semantics/geo-replicated.ts</code>

Report replication lag for a specific replica. Rejects an unknown region. Emits `geo.replica-lagged`.

```ts
export declare function markReplicaLagged(session: GeoReplicatedSession, input: {
    region: GeoRegion;
    lagMs: number;
}): AxisStep<GeoState>;
```

#### <code v-pre>resolveConflict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L136) <code v-pre>packages/edge/src/semantics/geo-replicated.ts</code>

Resolve a write conflict for a region by picking a winning version. Rejects an unknown region. Adopts the chosen version, clears every replica's lag and forces the session back to 'in-sync'. Emits `geo.conflict-resolved`.

```ts
export declare function resolveConflict(session: GeoReplicatedSession, input: {
    region: GeoRegion;
    chosenVersion: number;
}): AxisStep<GeoState>;
```

#### <code v-pre>syncReplica</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L112) <code v-pre>packages/edge/src/semantics/geo-replicated.ts</code>

Mark a replica caught up (lag → 0). When every replica has zero lag the session returns 'in-sync'. Rejects an unknown region. Emits `geo.replica-synced`.

```ts
export declare function syncReplica(session: GeoReplicatedSession, input: {
    region: GeoRegion;
}): AxisStep<GeoState>;
```

### 型

#### <code v-pre>GeoRegion</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L19) <code v-pre>packages/edge/src/semantics/geo-replicated.ts</code>

Geo-replicated store — a primary region that accepts writes and N replica regions that catch up asynchronously. This is the multi-region consistency model behind Cloudflare Smart Placement + KV replication, Vercel Edge Config replication, and Deno KV's primary/replica topology. The mock exposes the observable lifecycle a test cares about: a primary write bumps a version and leaves replicas lagging, each replica is marked lagged then synced, and a write conflict can be explicitly resolved. State transitions: createGeoReplicatedSession → 'in-sync' (version 0, no lag) geoPrimaryWrite → 'lagging' (replicas fall behind) markReplicaLagged → 'lagging' syncReplica → 'in-sync' (only once every replica lag = 0) resolveConflict → 'in-sync'

```ts
export type GeoRegion = string;
```

#### <code v-pre>GeoReplicatedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L23) <code v-pre>packages/edge/src/semantics/geo-replicated.ts</code>

```ts
export interface GeoReplicatedSession {
    platform: EdgePlatform;
    primaryRegion: GeoRegion;
    replicaRegions: GeoRegion[];
    state: GeoState;
    version: number;
    lagMs: Record<GeoRegion, number>;
    history: AxisStep<GeoState>[];
}
```

#### <code v-pre>GeoState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L21) <code v-pre>packages/edge/src/semantics/geo-replicated.ts</code>

```ts
export type GeoState = 'in-sync' | 'lagging' | 'conflict-detected';
```
