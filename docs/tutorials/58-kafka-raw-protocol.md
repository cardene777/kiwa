# Kafka raw-protocol — KIP-98 idempotent producer + transaction coordinator + fetch session + ISR in 15 min

## What you'll build

A vitest suite wired to `@kiwa/streaming` v0.3 that models the pieces of the Kafka wire protocol every exactly-once test bumps into — producer id + epoch fencing (KIP-98), the transaction coordinator state machine (`Empty` → `Ongoing` → `PrepareCommit` → `CompleteCommit` → `Empty`), incremental fetch sessions (KIP-227), and the in-sync replica (ISR) set with high-watermark advance rules. No broker binary, no docker-compose, no `kafkajs.admin()`. `createKafkaRawProtocol()` gives you every one of those pieces as a test-side model, so the assertion "the second `send()` after a fenced producer got `INVALID_PRODUCER_EPOCH`" fires without a real Kafka. This is the pattern the streaming v0.3 8-axis grid uses under the hood — same producer identity semantics, same txn state machine, same ISR + HW gate. You leave this tutorial with a runnable exactly-once model + a fencing assertion + a HW gate that behaves like a real Kafka cluster in seconds instead of minutes.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-kafka-raw && cd kiwa-kafka-raw
pnpm init
pnpm add -D @kiwa/streaming@^0.3 vitest typescript @types/node
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

`@kiwa/streaming` v0.3 ships the 8-axis advanced-semantics surface (`createKafkaRawProtocol` + `createKafkaConsumerGroup` + `createRedpandaSchemaEvolution` + `createRedpandaTransactions` + `createNatsJetStreamDurable` + `createNatsKvObject` + `createExactlyOnceSemantics` + `createConsumerLagTelemetry`) alongside the v0.1 unified mocks. This tutorial focuses on axis 1 (Kafka raw protocol) — tutorial 59 covers Redpanda schema evolution, tutorial 60 covers NATS JetStream durable.

### 2. InitProducerId + epoch fencing

`tests/kafka-raw/fencing.test.ts` — the first thing an EOS (exactly-once) producer does is call `InitProducerId` to claim a `{ producerId, epoch }` pair. If the coordinator later re-inits the same id (client crash, timeout), the epoch bumps and any lingering older-epoch send from the old client is rejected as `INVALID_PRODUCER_EPOCH`.

```ts
import { describe, expect, it } from 'vitest';
import { createKafkaRawProtocol } from '@kiwa/streaming';

describe('KIP-98 producer identity fencing', () => {
  it('fenceProducer bumps epoch and invalidates the old identity', () => {
    const raw = createKafkaRawProtocol();
    const first = raw.initProducerId();
    expect(first.epoch).toBe(0);
    expect(raw.isValidEpoch(first)).toBe(true);

    const fenced = raw.fenceProducer(first.producerId);
    expect(fenced.epoch).toBe(1);
    expect(raw.isValidEpoch(first)).toBe(false);
    expect(raw.isValidEpoch(fenced)).toBe(true);
  });
});
```

The rule is that a fenced producer identity **is not just invalid** — it is invalid *because* the coordinator handed a fresh epoch to whoever asked next. The test asserts on both sides of that gate — the old identity fails `isValidEpoch`, the new identity passes — because a real Kafka client bug looks like "the retry loop kept using the pre-fence epoch". You need to catch that shape, not just "the send threw".

### 3. Transaction coordinator state machine

`tests/kafka-raw/txn-state.test.ts` — the txn coordinator lives on the broker and runs a 6-state machine (`Empty` / `Ongoing` / `PrepareCommit` / `CompleteCommit` / `PrepareAbort` / `CompleteAbort`). Every transactional `send()` starts by transitioning `Empty` → `Ongoing`, and every `commitTransaction()` runs `Ongoing` → `PrepareCommit` → `CompleteCommit` → `Empty`.

```ts
import { describe, expect, it } from 'vitest';
import { createKafkaRawProtocol } from '@kiwa/streaming';

describe('KIP-98 transaction coordinator state machine', () => {
  it('follows the 4-step commit path Empty → Ongoing → PrepareCommit → CompleteCommit → Empty', () => {
    const raw = createKafkaRawProtocol();
    expect(raw.transactionState()).toBe('Empty');

    raw.transitionTransaction('Empty', 'Ongoing');
    raw.transitionTransaction('Ongoing', 'PrepareCommit');
    raw.transitionTransaction('PrepareCommit', 'CompleteCommit');
    raw.transitionTransaction('CompleteCommit', 'Empty');
    expect(raw.transactionState()).toBe('Empty');
  });

  it('rejects illegal transitions (Empty → PrepareCommit)', () => {
    const raw = createKafkaRawProtocol();
    expect(() => raw.transitionTransaction('Empty', 'PrepareCommit')).toThrow(/invalid txn transition/);
  });
});
```

The `Empty → PrepareCommit` shortcut is the exact bug a "double commit" client hits — the retry loop thinks the previous commit failed and calls `commitTransaction()` twice. The state machine catches that at the boundary; without the raw-protocol model your test either succeeds silently or needs a real broker to produce the coordinator error.

### 4. Fetch session + incremental epoch (KIP-227)

`tests/kafka-raw/fetch-session.test.ts` — every consumer opens a fetch session when it first calls `Fetch` and increments the session epoch on each subsequent poll. If a stale request with an older epoch shows up, the broker rejects it.

```ts
import { describe, expect, it } from 'vitest';
import { createKafkaRawProtocol } from '@kiwa/streaming';

describe('KIP-227 incremental fetch session', () => {
  it('bumpFetchSession increments the epoch on each call', () => {
    const raw = createKafkaRawProtocol();
    const session = raw.openFetchSession();
    expect(session.epoch).toBe(0);

    expect(raw.bumpFetchSession(session.sessionId)).toBe(1);
    expect(raw.bumpFetchSession(session.sessionId)).toBe(2);
    expect(raw.bumpFetchSession(session.sessionId)).toBe(3);
  });

  it('throws when the session id is unknown (broker closed the session)', () => {
    const raw = createKafkaRawProtocol();
    expect(() => raw.bumpFetchSession(9999)).toThrow(/fetch session .* not open/);
  });
});
```

### 5. ISR set + high-watermark gate

`tests/kafka-raw/isr-hw.test.ts` — the high-watermark (HW) is the "safe to consume up to here" boundary the broker advertises. HW cannot advance past the last offset acknowledged by every replica in the ISR, and it will not advance at all if the ISR has fewer than `min.insync.replicas` members.

```ts
import { describe, expect, it } from 'vitest';
import { createKafkaRawProtocol } from '@kiwa/streaming';

describe('ISR + high-watermark advance rules', () => {
  it('HW advances when the ISR has >= min.insync.replicas members', () => {
    const raw = createKafkaRawProtocol({ replicationFactor: 3, minInSyncReplicas: 2 });
    raw.addToIsr('orders', 0, 1);
    raw.addToIsr('orders', 0, 2);
    expect(raw.getIsr('orders', 0)).toEqual([1, 2]);

    expect(raw.advanceHighWatermark('orders', 0, 100)).toBe(100);
    expect(raw.getHighWatermark('orders', 0)).toBe(100);
  });

  it('HW freezes when the ISR shrinks below min.insync.replicas', () => {
    const raw = createKafkaRawProtocol({ replicationFactor: 3, minInSyncReplicas: 2 });
    raw.addToIsr('orders', 0, 1);
    raw.addToIsr('orders', 0, 2);
    raw.advanceHighWatermark('orders', 0, 50);
    raw.removeFromIsr('orders', 0, 2);
    expect(raw.getIsr('orders', 0)).toEqual([1]);

    expect(raw.advanceHighWatermark('orders', 0, 100)).toBe(50);
    expect(raw.getHighWatermark('orders', 0)).toBe(50);
  });
});
```

The `min.insync.replicas` gate is what stops the "silent data loss" pattern — a producer with `acks=all` waits on the ISR count, so a stuck-at-50 HW is the correct behavior when replica 2 drops out. Assertion on the `advanceHighWatermark` return value + `getHighWatermark` after a `removeFromIsr` is the exact test that catches "the HW kept advancing even after we lost a replica" bugs.

## What you learned

The 4 raw-protocol pieces the tutorial covered — producer id + epoch fencing, txn coordinator state machine, incremental fetch session, and ISR + HW gate — are the failure surfaces every exactly-once test hits. `@kiwa/streaming` v0.3 packages them as a test-side model so the assertion runs in milliseconds instead of the seconds a real broker + testcontainers takes. When you graduate to a real driver run (`KIWA_MODE=real KAFKA_KEY=...`), the fidelity harness compares the same assertion output against the actual broker — see the v1.30 → v1.31 migration guide for the env-gate contract.

## Next

- Tutorial 59 — Redpanda schema evolution (BACKWARD / FORWARD / FULL compatibility + subject naming + references)
- Tutorial 60 — NATS JetStream durable consumer (ack_wait + max_deliver + backoff + quarantine)
- Concept — `docs/concepts/streaming-real-driver-testing.md` (8 axis × 3 provider = 24 row grid + testcontainers pattern SSOT)
- Migration — `docs/migrations/v1.30-to-v1.31.md` (streaming v0.2 → v0.3 opt-in surface + no breakage)
