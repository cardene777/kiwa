# Postgres CDC + outbox pattern — change data capture in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/orm` v0.9 that walks the CDC (change data capture) axis end-to-end for a Debezium-style outbox pattern on Postgres. You will decode a change event out of a simulated logical replication slot, append it to an outbox buffer, assert strict LSN ordering, and confirm at-least-once delivery downstream. The exact pattern that `examples/dogfood-postgres-cdc-outbox-app` (Next.js 15 + drizzle + Postgres 16 + Redis Streams consumer) uses — same `createCdcSession` + `decodeEvent` + `appendOutbox` + `markEventOrdered` + `confirmDelivery` primitives, same state-machine guards, same LSN invariants. You leave this tutorial with a runnable outbox test and a working delivery pointer for any Postgres CDC flow you point it at.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-cdc-outbox && cd kiwa-cdc-outbox
pnpm init
pnpm add -D @kiwa-lab/orm@^0.9 vitest typescript @types/node
```

Add the vitest script in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

### 2. Open a CDC session

`tests/cdc/session.test.ts` — `createCdcSession` opens a logical-slot-shaped session. It starts at `idle` with empty decoded / outbox buffers and `confirmedLsn = 0`.

```ts
import { describe, expect, it } from 'vitest';
import { createCdcSession } from '@kiwa-lab/orm';

describe('cdc — session ctor', () => {
  it('starts idle with empty buffers', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });

    expect(session.state).toBe('idle');
    expect(session.decoded).toHaveLength(0);
    expect(session.outbox).toHaveLength(0);
    expect(session.confirmedLsn).toBe(0);
    expect(session.history).toHaveLength(0);
  });
});
```

The session object is a plain state-machine container — no I/O, no timers, no adapters. Every subsequent step function returns an `AxisStep<CdcState>` envelope with `neutralEvent` (portable) and `backendEvent` (backend dialect); Postgres uses `pg_logical_slot.decoded` where SQLite would fall back to the neutral name.

### 3. Decode a change event

`tests/cdc/decode.test.ts` — `decodeEvent` moves the session from `idle → decoding` and pushes the row-level change onto the `decoded` buffer. The LSN must be positive; a non-positive LSN is a bug (the log is monotonically increasing).

```ts
import { describe, expect, it } from 'vitest';
import { createCdcSession, decodeEvent } from '@kiwa-lab/orm';

describe('cdc — decode', () => {
  it('records the decoded event and moves to decoding', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });

    const step = decodeEvent(session, {
      event: { lsn: 101, kind: 'insert', table: 'orders', payload: { id: '1' } },
    });

    expect(step.neutralEvent).toBe('cdc.decoded');
    expect(step.backendEvent).toBe('pg_logical_slot.decoded');
    expect(step.state).toBe('decoding');
    expect(session.decoded).toHaveLength(1);
    expect(session.decoded[0]?.lsn).toBe(101);
  });

  it('throws when lsn is not positive', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });

    expect(() =>
      decodeEvent(session, {
        event: { lsn: 0, kind: 'insert', table: 'orders', payload: {} },
      }),
    ).toThrow(/lsn must be positive/);
  });
});
```

The step envelope carries LSN + kind + table in `metadata` so downstream telemetry (dashboards, alerting) can key on those without re-reading the event. `backendEvent` differs per backend — Postgres emits `pg_logical_slot.decoded`, MySQL emits `binlog.event_decoded`.

### 4. Append to the outbox

`tests/cdc/outbox.test.ts` — `appendOutbox` moves the session from `decoding → buffered` and pushes the decoded event (or an explicit override) onto the outbox buffer. Repeated calls stack the events for the eventual delivery batch.

```ts
import { describe, expect, it } from 'vitest';
import {
  appendOutbox,
  createCdcSession,
  decodeEvent,
} from '@kiwa-lab/orm';

describe('cdc — outbox append', () => {
  it('moves decoding -> buffered and preserves the event', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    decodeEvent(session, {
      event: { lsn: 101, kind: 'insert', table: 'orders', payload: { id: '1' } },
    });

    const step = appendOutbox(session, {});

    expect(step.neutralEvent).toBe('cdc.outbox-appended');
    expect(step.backendEvent).toBe('outbox.wal2json_appended');
    expect(step.state).toBe('buffered');
    expect(session.outbox).toHaveLength(1);
    expect(session.outbox[0]?.lsn).toBe(101);
  });

  it('throws when appending from idle (no decoded event yet)', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });

    expect(() => appendOutbox(session, {})).toThrow(/decoding \/ buffered \/ ordered/);
  });
});
```

The `appendOutbox` guard rejects appends from `idle` / `delivered` states — the state machine refuses silent regressions from a terminal `delivered` back to `buffered`. The Postgres backend event is `outbox.wal2json_appended`, matching a `wal2json`-based decoder pipeline in the dogfood app.

### 5. Assert LSN ordering

`tests/cdc/ordering.test.ts` — `markEventOrdered` walks the outbox and asserts that every LSN is strictly greater than the predecessor. Out-of-order LSNs are the classic CDC bug — a decoder that re-reads a slot after a checkpoint reset can emit rows twice with an older LSN. The state machine turns that bug into a test failure.

```ts
import { describe, expect, it } from 'vitest';
import {
  appendOutbox,
  createCdcSession,
  decodeEvent,
  markEventOrdered,
} from '@kiwa-lab/orm';

describe('cdc — LSN ordering', () => {
  it('accepts a strictly increasing outbox', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    for (const lsn of [101, 102, 103]) {
      decodeEvent(session, { event: { lsn, kind: 'insert', table: 'orders', payload: {} } });
      appendOutbox(session, {});
    }

    const step = markEventOrdered(session);

    expect(step.state).toBe('ordered');
    expect(step.metadata.highWaterLsn).toBe(103);
    expect(step.metadata.outboxSize).toBe(3);
  });

  it('throws on an out-of-order outbox', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    decodeEvent(session, { event: { lsn: 103, kind: 'insert', table: 'orders', payload: {} } });
    appendOutbox(session, {});
    decodeEvent(session, { event: { lsn: 101, kind: 'insert', table: 'orders', payload: {} } });
    appendOutbox(session, {});

    expect(() => markEventOrdered(session)).toThrow(/LSN out of order/);
  });
});
```

`markEventOrdered` is idempotent — you can call it again after more appends and it re-validates from the start of the outbox. The `metadata.highWaterLsn` is what the delivery pointer uses in the next step.

### 6. Confirm at-least-once delivery

`tests/cdc/delivery.test.ts` — `confirmDelivery` advances the delivery pointer to a caller-supplied LSN. The guards refuse (a) a pointer regression (`upToLsn < confirmedLsn` — silent duplicate delivery) and (b) a pointer that exceeds the outbox high-water (acking events that were never appended — invariant violation).

```ts
import { describe, expect, it } from 'vitest';
import {
  appendOutbox,
  confirmDelivery,
  createCdcSession,
  decodeEvent,
  markEventOrdered,
} from '@kiwa-lab/orm';

describe('cdc — confirm delivery', () => {
  it('advances confirmedLsn and moves to delivered', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    for (const lsn of [101, 102, 103]) {
      decodeEvent(session, { event: { lsn, kind: 'insert', table: 'orders', payload: {} } });
      appendOutbox(session, {});
    }
    markEventOrdered(session);

    const step = confirmDelivery(session, { upToLsn: 103 });

    expect(step.neutralEvent).toBe('cdc.at-least-once-delivered');
    expect(step.backendEvent).toBe('pg_logical_slot.confirmed_flush');
    expect(step.state).toBe('delivered');
    expect(session.confirmedLsn).toBe(103);
  });

  it('rejects a pointer regression', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    decodeEvent(session, { event: { lsn: 101, kind: 'insert', table: 'orders', payload: {} } });
    appendOutbox(session, {});
    markEventOrdered(session);
    confirmDelivery(session, { upToLsn: 101 });

    expect(() => confirmDelivery(session, { upToLsn: 50 })).toThrow(/regresses/);
  });

  it('rejects a pointer beyond the outbox high-water', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    decodeEvent(session, { event: { lsn: 101, kind: 'insert', table: 'orders', payload: {} } });
    appendOutbox(session, {});
    markEventOrdered(session);

    expect(() => confirmDelivery(session, { upToLsn: 500 })).toThrow(/exceeds outbox high-water/);
  });
});
```

The three assertions map to the three bugs a real CDC pipeline hits — duplicate delivery, out-of-order delivery, and phantom acks. Postgres emits `pg_logical_slot.confirmed_flush` as the backend event; a downstream telemetry consumer keys on either `neutralEvent` or `backendEvent` depending on how portable the dashboard needs to be.

### 7. Run it

```bash
pnpm test
```

Every step above returns an `AxisStep<CdcState>` envelope so downstream tests can assert on either the state machine outcome (`step.state === 'delivered'`) or the emitted event (`step.neutralEvent === 'cdc.at-least-once-delivered'`). The full end-to-end pattern lives in `packages/orm/tests/docs-tutorial-v1.26.test.ts` — the snippet validation test that guarantees every code sample in this tutorial keeps matching the real `@kiwa-lab/orm` v0.9 API.

## Where to next

- [Tutorial 48 — MySQL RLS + multi-tenant (rls + connection-pool axes)](./48-mysql-rls-tenant)
- [Tutorial 49 — pgvector + hybrid search (vector-store axis)](./49-vector-search-pgvector)
- [Concept — Db advanced testing SSOT (8 axis + provider × backend fidelity table)](../concepts/db-advanced-testing)
- [Migration guide — v1.25 → v1.26](../migrations/v1.25-to-v1.26)
