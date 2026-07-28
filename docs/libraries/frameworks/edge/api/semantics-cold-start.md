---
title: "@kiwa-lab/edge semantics-cold-start の API 契約"
---

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics-cold-start</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>evictExpired</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L116) <code v-pre>packages/edge/src/semantics/cold-start.ts</code>

Evict warm instances whose last invocation is older than TTL at the simulated wall-clock `nowMs`. Returns the count evicted. Provisioned instances are never evicted.

```ts
export declare function evictExpired(session: ColdStartSession, input: {
    nowMs: number;
}): number;
```

#### <code v-pre>invokeColdStart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L48) <code v-pre>packages/edge/src/semantics/cold-start.ts</code>

Invoke a function with `instanceId` at simulated wall-clock `nowMs`. The class emitted depends on pool state — `provisioned` if reserved, `warm` if within TTL of last invoke, `cold` otherwise. After invocation the instance is marked warm.

```ts
export declare function invokeColdStart(session: ColdStartSession, input: {
    instanceId: string;
    nowMs: number;
}): AxisStep<ColdStartClass>;
```

#### <code v-pre>preWarmInstance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L90) <code v-pre>packages/edge/src/semantics/cold-start.ts</code>

Explicitly pre-warm an instance without producing latency (e.g. via scheduled ping). Emits `cold-start.warmed` and marks the instance warm.

```ts
export declare function preWarmInstance(session: ColdStartSession, input: {
    instanceId: string;
    nowMs: number;
}): AxisStep<ColdStartClass>;
```

#### <code v-pre>startColdStartPool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L27) <code v-pre>packages/edge/src/semantics/cold-start.ts</code>

Open a cold-start pool. `warmedTtlMs` defines how long a warm instance lives after last invocation before eviction. `provisionedIds` are always-on reservations that never fall back to cold.

```ts
export declare function startColdStartPool(input: {
    platform: EdgePlatform;
    warmedTtlMs?: number;
    provisionedIds?: string[];
}): ColdStartSession;
```

### 型

#### <code v-pre>ColdStartClass</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L11) <code v-pre>packages/edge/src/semantics/cold-start.ts</code>

Cold-start axis — serverless function warm/cold path + provisioned concurrency. Real edge runtimes distinguish `cold` (VM allocation + JIT), `warm` (recent eviction still in cache), and `provisioned` (always-on reserved instance) paths — each hits a different latency profile. The helper tracks the pool of warm instances and provisioned reservations, then returns which class the next invocation lands in.

```ts
export type ColdStartClass = 'cold' | 'warm' | 'provisioned';
```

#### <code v-pre>ColdStartSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L13) <code v-pre>packages/edge/src/semantics/cold-start.ts</code>

```ts
export interface ColdStartSession {
    platform: EdgePlatform;
    warmedIds: Set<string>;
    provisionedIds: Set<string>;
    warmedTtlMs: number;
    lastInvokeAtMs: Record<string, number>;
    history: AxisStep<ColdStartClass>[];
}
```
