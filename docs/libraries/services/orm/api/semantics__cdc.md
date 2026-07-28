---
title: "@kiwa-lab/orm semantics__cdc の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics&#95;&#95;cdc</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>appendOutbox</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L101) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Append the last decoded event (or an explicitly supplied one) to the Debezium-style outbox table. Emits `cdc.outbox-appended`. Requires the session to be 'decoding', 'buffered', or 'ordered' — an idle session or a session already 'delivered' cannot append silently, so the JSDoc-declared precondition is enforced at runtime to prevent silent state regression (e.g. `delivered → buffered`).

```ts
export declare function appendOutbox(session: CdcSession, input: {
    event?: CdcEvent;
}): AxisStep<CdcState>;
```

#### <code v-pre>confirmDelivery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L173) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Confirm at-least-once delivery up to a given LSN. Requires prior `markEventOrdered` so that ordering is asserted before ack. Emits `cdc.at-least-once-delivered` and advances `confirmedLsn`. Rejects when `upToLsn` exceeds the outbox high-water mark (the max LSN currently in the outbox) — acknowledging events that were never appended silently corrupts the delivery invariant.

```ts
export declare function confirmDelivery(session: CdcSession, input: {
    upToLsn: number;
}): AxisStep<CdcState>;
```

#### <code v-pre>createCdcSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L48) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Create a CDC session bound to a logical slot / consumer id. State starts at 'idle' with an empty decoded / outbox buffer.

```ts
export declare function createCdcSession(input: {
    slotName: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): CdcSession;
```

#### <code v-pre>decodeEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L70) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Decode a single change log entry into a neutral CDC event. Appends to the decoded buffer and moves the session into 'decoding'. Emits `cdc.decoded`.

```ts
export declare function decodeEvent(session: CdcSession, input: {
    event: CdcEvent;
}): AxisStep<CdcState>;
```

#### <code v-pre>markEventOrdered</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L140) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Assert strict LSN ordering on the outbox. Walks the outbox and rejects if an event has a smaller LSN than a predecessor. Emits `cdc.event-ordered`. The check is deterministic and idempotent — repeated calls after further appends stay valid as long as ordering holds.

```ts
export declare function markEventOrdered(session: CdcSession): AxisStep<CdcState>;
```

### 型

#### <code v-pre>CdcEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L21) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

```ts
export interface CdcEvent {
    lsn: number;
    kind: CdcEventKind;
    table: string;
    payload: Record<string, string | number | boolean>;
}
```

#### <code v-pre>CdcEventKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L19) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

```ts
export type CdcEventKind = 'insert' | 'update' | 'delete';
```

#### <code v-pre>CdcSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L28) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

```ts
export interface CdcSession {
    slotName: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: CdcState;
    decoded: CdcEvent[];
    outbox: CdcEvent[];
    confirmedLsn: number;
    history: AxisStep<CdcState>[];
}
```

#### <code v-pre>CdcState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L17) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Change data capture (CDC) — decode a backend-specific change log into neutral events, append to a Debezium-style outbox table, keep events in strict LSN order, and confirm at-least-once delivery. Postgres uses logical decoding (wal2json), MySQL uses Debezium against the binlog, SQLite has no server-side CDC so the mock falls back to neutral names. State transitions: created → 'idle' decodeEvent → 'decoding' appendOutbox → 'buffered' markEventOrdered → 'ordered' confirmDelivery → 'delivered'

```ts
export type CdcState = 'idle' | 'decoding' | 'buffered' | 'ordered' | 'delivered';
```
