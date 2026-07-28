---
title: "@kiwa-lab/edge semantics__durable-object の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics&#95;&#95;durable-object</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createDurableObject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L41) <code v-pre>packages/edge/src/semantics/durable-object.ts</code>

Create a durable object instance. State starts at 'initialized' and no request has been served yet. Emits `durable-object.created`.

```ts
export declare function createDurableObject(input: {
    id: string;
    platform: EdgePlatform;
}): DurableObjectSession;
```

#### <code v-pre>fireAlarm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L90) <code v-pre>packages/edge/src/semantics/durable-object.ts</code>

Fire the scheduled alarm. Wakes the object into 'active' regardless of the prior state and clears the pending alarm. Emits `durable-object.alarm-fired`.

```ts
export declare function fireAlarm(session: DurableObjectSession): AxisStep<DoState>;
```

#### <code v-pre>requestDurableObject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L68) <code v-pre>packages/edge/src/semantics/durable-object.ts</code>

Route a fetch request to the object. Pins the instance 'active' and bumps the request counter. Emits `durable-object.requested`.

```ts
export declare function requestDurableObject(session: DurableObjectSession, input: {
    url: string;
}): AxisStep<DoState>;
```

#### <code v-pre>writeStorage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L110) <code v-pre>packages/edge/src/semantics/durable-object.ts</code>

Write a key to transactional storage. Implies an active handler, so the object stays 'active'. Emits `durable-object.storage-written`.

```ts
export declare function writeStorage(session: DurableObjectSession, input: {
    key: string;
    value: string;
}): AxisStep<DoState>;
```

### 型

#### <code v-pre>DoState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L19) <code v-pre>packages/edge/src/semantics/durable-object.ts</code>

Durable Object — stateful, single-instance actor pinned to one edge location. Cloudflare Durable Objects are the canonical example; Vercel's closest analogue is a session-affine edge function, Deno Deploy exposes stateful objects backed by Deno KV. The mock reproduces the user-observable lifecycle: an instance is created once, receives fetch requests (which pin it "active"), can wake on a scheduled alarm, and persists to transactional storage. Hibernation / eviction is intentionally out of scope for v0.2 — the axis only exposes the 4 neutral events the fidelity grid tracks. State transitions: created → 'initialized' requestDurableObject → 'active' (from initialized or active) fireAlarm → 'active' (an alarm wakes the object) writeStorage → 'active' (a storage write implies an active handler)

```ts
export type DoState = 'initialized' | 'active' | 'hibernated' | 'terminated';
```

#### <code v-pre>DurableObjectSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L21) <code v-pre>packages/edge/src/semantics/durable-object.ts</code>

```ts
export interface DurableObjectSession {
    id: string;
    platform: EdgePlatform;
    state: DoState;
    requestCount: number;
    storageKeys: Map<string, string>;
    scheduledAlarmAt: number | null;
    history: AxisStep<DoState>[];
}
```
