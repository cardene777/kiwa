# NATS JetStream durable consumer — ack_wait + max_deliver + backoff + quarantine in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/streaming` v0.3 that models a durable JetStream consumer — `durable_name` + `ack_wait` + `max_deliver` + `ack_policy` (`explicit` / `all` / `none`) + a `backoff[]` schedule + quarantine on the `maxDeliver`+1st failure — without booting a real `nats-server` binary. `createNatsJetStreamDurable()` gives you the ack-tracking state kept on the broker side (ack-pending window, ack-floor, redelivery-eligible-at) plus the 4 operations that drive it (`publish` / `deliver` / `ack` / `nack` / `sweepExpired`). This is the pattern kiwa's NATS dogfood app (v1.31-4) exercises against real NATS 2.10+ testcontainers under the fidelity harness; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "message was redelivered 4 times then quarantined" case reviewers ask about.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-jetstream-durable && cd kiwa-jetstream-durable
pnpm init
pnpm add -D @kiwa-test/streaming@^0.3 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.3 surface exports `createNatsJetStreamDurable` from the semantics barrel. This tutorial focuses on axis 5 of the 8-axis grid; tutorial 58 covers axis 1 (Kafka raw protocol), tutorial 59 covers axis 3 (Redpanda schema evolution).

### 2. Publish + deliver + ack — the happy path

`tests/durable/happy-path.test.ts` — a durable consumer publishes to a stream, delivers the next unacked message, and marks it done when the handler succeeds.

```ts
import { describe, expect, it } from 'vitest';
import { createNatsJetStreamDurable } from '@kiwa-test/streaming';

describe('durable consumer — publish + deliver + ack', () => {
  it('delivers each unacked message once and acks it done', () => {
    const durable = createNatsJetStreamDurable<string>({
      durableName: 'orders-worker',
      ackWaitMs: 1_000,
      maxDeliver: 3,
    });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'first', headers: {} });
    durable.publish({ topic: 'orders', partition: 0, timestamp: 0, key: null, value: 'second', headers: {} });

    const attempt1 = durable.deliver(100);
    expect(attempt1?.message.value).toBe('first');
    expect(attempt1?.attempt).toBe(1);
    durable.ack(attempt1!.seq);

    const attempt2 = durable.deliver(200);
    expect(attempt2?.message.value).toBe('second');
    durable.ack(attempt2!.seq);

    expect(durable.deliver(300)).toBeNull();
    expect(durable.info().pending).toBe(0);
  });
});
```

The rule of thumb is that `deliver(now)` takes an explicit `now` timestamp — real JetStream uses a wall-clock timer, and the mock takes the timestamp as an argument so tests can advance time deterministically. `durable.info()` surfaces `{ delivered, ackFloor, pending }` for assertion; a stuck consumer with `pending > 0` after a full sweep is exactly the shape of "the ack got lost" bugs.

### 3. Nack + backoff schedule — redelivery with delay

`tests/durable/backoff.test.ts` — a nacked message goes back onto the pending queue but is *not* eligible for redelivery until the backoff for that attempt has elapsed. The backoff array (`[100, 500, 2000]` ms) sets the delay per attempt.

```ts
import { describe, expect, it } from 'vitest';
import { createNatsJetStreamDurable } from '@kiwa-test/streaming';

describe('backoff schedule', () => {
  it('respects the per-attempt backoff between redeliveries', () => {
    const durable = createNatsJetStreamDurable<string>({
      durableName: 'retry-worker',
      ackWaitMs: 5_000,
      maxDeliver: 5,
      backoff: [100, 500, 2_000],
    });
    durable.publish({ topic: 'jobs', partition: 0, timestamp: 0, key: null, value: 'x', headers: {} });

    const first = durable.deliver(0);
    expect(first?.attempt).toBe(1);
    durable.nack(first!.seq, 0);

    // Not eligible yet — backoff[0] = 100 ms.
    expect(durable.deliver(50)).toBeNull();

    // After backoff[0], redelivery kicks in.
    const second = durable.deliver(200);
    expect(second?.attempt).toBe(2);
    durable.nack(second!.seq, 200);

    // Not eligible yet — backoff[1] = 500 ms + last delivered at 200 ms.
    expect(durable.deliver(500)).toBeNull();

    const third = durable.deliver(800);
    expect(third?.attempt).toBe(3);
  });
});
```

The nack-with-timestamp shape (`nack(seq, now)`) matches the real JetStream client's behavior — the broker knows when the nack arrived, so the "eligible for redelivery" gate is `lastDeliveredAt + backoff[attempt-1]`. A test that skips the timestamp cannot distinguish "the redelivery kicked in too early" from "the client racing with the timer", so the mock enforces the timestamp explicitly.

### 4. `max_deliver` + quarantine

`tests/durable/quarantine.test.ts` — after `max_deliver` attempts fail, the message is quarantined for later inspection and does not redeliver again.

```ts
import { describe, expect, it } from 'vitest';
import { createNatsJetStreamDurable } from '@kiwa-test/streaming';

describe('max_deliver + quarantine', () => {
  it('quarantines the message on the maxDeliver+1st failure', () => {
    const durable = createNatsJetStreamDurable<string>({
      durableName: 'q-worker',
      ackWaitMs: 100,
      maxDeliver: 3,
    });
    durable.publish({ topic: 'q', partition: 0, timestamp: 0, key: null, value: 'poison', headers: {} });

    let now = 0;
    for (let i = 0; i < 3; i++) {
      const attempt = durable.deliver(now);
      expect(attempt).not.toBeNull();
      durable.nack(attempt!.seq, now);
      now += 200;
    }

    // 4th delivery — quarantine.
    expect(durable.deliver(now)).toBeNull();
    const q = durable.quarantined();
    expect(q).toHaveLength(1);
    expect(q[0]?.attempts).toBe(3);
    expect(q[0]?.reason).toMatch(/max_deliver/);
  });
});
```

Quarantine is the JetStream analogue of a DLQ — the message is out of the redelivery rotation but still inspectable. The `reason` string tells you which limit tripped (`max_deliver` is one; a real deployment may also add `filter_subject` mismatch or `deliver_group` fencing).

### 5. `sweepExpired` — advance the ack-wait timer

`tests/durable/ack-wait.test.ts` — if the consumer holds a message for longer than `ack_wait` without acking, the broker considers it stuck and redelivers. `sweepExpired(now)` is what real JetStream runs on a timer; tests drive it explicitly with a clock.

```ts
import { describe, expect, it } from 'vitest';
import { createNatsJetStreamDurable } from '@kiwa-test/streaming';

describe('ack_wait expiry sweep', () => {
  it('sweeps stuck deliveries and enables redelivery', () => {
    const durable = createNatsJetStreamDurable<string>({
      durableName: 'stuck-worker',
      ackWaitMs: 1_000,
      maxDeliver: 5,
    });
    durable.publish({ topic: 'jobs', partition: 0, timestamp: 0, key: null, value: 'v', headers: {} });

    const first = durable.deliver(0);
    expect(first?.attempt).toBe(1);
    // Consumer never acks — the ack_wait timer is what redelivers.
    expect(durable.deliver(500)).toBeNull();

    const swept = durable.sweepExpired(1_500);
    expect(swept).toContain(first!.seq);

    const second = durable.deliver(1_500);
    expect(second?.attempt).toBe(2);
    expect(second?.seq).toBe(first!.seq);
  });
});
```

The pair `sweepExpired(now)` + `deliver(now)` mirrors what real nats-server does on the `ackWait` tick — the sweep marks the entry eligible for redelivery, the next `deliver()` picks it up. Test-side control over the clock lets you assert "the sweep fired at exactly 1.5 s" without a `setTimeout` race.

## What you learned

The 4 durable-consumer pieces the tutorial covered — happy path, backoff-driven redelivery, quarantine on `max_deliver`, and ack-wait sweep — are the ones every retry-heavy NATS pipeline hits. `@kiwa-test/streaming` v0.3 models them with an explicit clock so tests run in milliseconds. Under `KIWA_MODE=real NATS_KEY=...`, the fidelity harness runs the same assertions against real NATS 2.10+ testcontainers — the v1.31-4 dogfood app does exactly that.

## Next

- Tutorial 58 — Kafka raw protocol (KIP-98 idempotent + txn coordinator + fetch session + ISR)
- Tutorial 59 — Redpanda schema evolution (BACKWARD / FORWARD / FULL + subject naming + references)
- Concept — `docs/concepts/streaming-real-driver-testing.md` (8 axis × 3 provider = 24 row grid + testcontainers pattern SSOT)
- Migration — `docs/migrations/v1.30-to-v1.31.md` (streaming v0.2 → v0.3 opt-in surface + no breakage)
