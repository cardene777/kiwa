# Redpanda schema evolution — Avro / Protobuf / JSON compatibility + subject naming + references in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/streaming` v0.3 that runs the Confluent-compatible schema-registry evolution check — BACKWARD / FORWARD / FULL (and the `_TRANSITIVE` variants) — against a versioned subject registry, picks the subject name with the 3 naming strategies (`topic-name`, `record-name`, `topic-record-name`), and traces a schema reference graph (`Order` → `Address`) so composed schemas keep resolving after evolution. No real Redpanda binary, no `curl http://schema-registry:8081/subjects/orders-value/versions`. `createRedpandaSchemaEvolution()` is the test-side model — same `register` + `check` + `subjectFor` + `resolveReferences` shape as the real API, keyed by structural markers (`OPTIONAL_ADD`, `REQUIRED_ADD`, `REQUIRED_REMOVE`, `TYPE_CHANGE`) that let a test declare what a schema change *is* without parsing an Avro AST. This is the pattern kiwa's Redpanda dogfood app (v1.31-3) exercises against real Redpanda 23+ testcontainers under the fidelity harness; the tutorial covers the mock-only path so you can iterate in milliseconds.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-schema-evo && cd kiwa-schema-evo
pnpm init
pnpm add -D @kiwa-lab/streaming@^0.3 vitest typescript @types/node
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

The v0.3 surface exports `createRedpandaSchemaEvolution` from the semantics barrel — it lives alongside the v0.1 unified `createRedpandaMock` for the Kafka-API-compatible producer / consumer paths. This tutorial covers axis 3 of the 8-axis grid; tutorial 58 covers axis 1 (Kafka raw protocol), tutorial 60 covers axis 5 (NATS JetStream durable).

### 2. BACKWARD — add an optional field is OK, add a required field breaks

`tests/schema-evo/backward.test.ts` — BACKWARD is the default mode Confluent ships and it maps to "new consumers can read old messages". That means the new schema can add an optional field (readers default it) but cannot add a required one (readers have nothing to fill it with).

```ts
import { describe, expect, it } from 'vitest';
import { createRedpandaSchemaEvolution } from '@kiwa-lab/streaming';

describe('BACKWARD compatibility — new consumers read old data', () => {
  it('adding an optional field is BACKWARD-compatible', () => {
    const registry = createRedpandaSchemaEvolution({ defaultCompatibility: 'BACKWARD' });
    registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]}',
    });

    const check = registry.check({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]} OPTIONAL_ADD:tracking_number',
    });
    expect(check.compatible).toBe(true);
    expect(check.mode).toBe('BACKWARD');
  });

  it('adding a required field is NOT BACKWARD-compatible', () => {
    const registry = createRedpandaSchemaEvolution({ defaultCompatibility: 'BACKWARD' });
    registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]}',
    });

    const check = registry.check({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]} REQUIRED_ADD:merchant_id',
    });
    expect(check.compatible).toBe(false);
    expect(check.reasons[0]).toMatch(/added required field/);
  });
});
```

The rule of thumb is that the markers (`OPTIONAL_ADD:field_x`, `REQUIRED_ADD:field_x`) describe the *shape of the change* — the mock does not parse Avro / Protobuf / JSON Schema syntax, it inspects the markers. Structural markers are enough to reproduce every Confluent evolution check without pulling `avsc` or `protobufjs` into the test suite, and they keep the assertion targeted at what the reader / writer actually cares about.

### 3. FORWARD — remove an optional field is OK, remove a required field breaks

`tests/schema-evo/forward.test.ts` — FORWARD is "old consumers can read new messages", i.e., the writer can add fields freely but cannot remove ones the reader depends on.

```ts
import { describe, expect, it } from 'vitest';
import { createRedpandaSchemaEvolution } from '@kiwa-lab/streaming';

describe('FORWARD compatibility — old consumers read new data', () => {
  it('adding a required field is FORWARD-compatible', () => {
    const registry = createRedpandaSchemaEvolution({ defaultCompatibility: 'FORWARD' });
    registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]}',
    });
    const check = registry.check({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]} REQUIRED_ADD:merchant_id',
    });
    expect(check.compatible).toBe(true);
  });

  it('removing a required field is NOT FORWARD-compatible', () => {
    const registry = createRedpandaSchemaEvolution({ defaultCompatibility: 'FORWARD' });
    registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]}',
    });
    // The new candidate declares "I removed merchant_id" with a REQUIRED_REMOVE marker.
    const check = registry.check({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]} REQUIRED_REMOVE:merchant_id',
    });
    expect(check.compatible).toBe(false);
    expect(check.reasons[0]).toMatch(/removed required field/);
  });
});

The marker is a *declaration* — the caller states what the change is (`REQUIRED_ADD:x`, `REQUIRED_REMOVE:x`, `TYPE_CHANGE:x`). The oracle diffs the markers between prior and next to identify what evolved. That means a test author writes the marker matching the *intent* of the change; the mock does not infer it from the schema string.
```

### 4. FULL — every reader / writer combo must survive

`tests/schema-evo/full.test.ts` — FULL is the strict mode: the check runs BACKWARD and FORWARD together, so a compliant evolution must be safe in both directions.

```ts
import { describe, expect, it } from 'vitest';
import { createRedpandaSchemaEvolution } from '@kiwa-lab/streaming';

describe('FULL compatibility — bidirectional safety', () => {
  it('type change on a field breaks FULL', () => {
    const registry = createRedpandaSchemaEvolution({ defaultCompatibility: 'FULL' });
    registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]}',
    });

    const check = registry.check({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[]} TYPE_CHANGE:price',
    });
    expect(check.compatible).toBe(false);
    expect(check.reasons.join(' ')).toMatch(/type change on field/);
  });
});
```

The `TYPE_CHANGE` marker is the marker that trips FULL under every mode — it never survives a bidirectional read. Real-world example: changing `price` from `int` → `float` is silently lossy on old readers (integer truncation) and silently invalid on old writers (float precision). The check surfaces it before it hits production.

### 5. Subject naming — `topic-name` vs `record-name` vs `topic-record-name`

`tests/schema-evo/subject-naming.test.ts` — the subject name determines *what* is versioned. Kafka Streams runs multi-record topics under `record-name` so different record types can evolve independently; a single-record topic under `topic-name` keeps things simple.

```ts
import { describe, expect, it } from 'vitest';
import { createRedpandaSchemaEvolution } from '@kiwa-lab/streaming';

describe('subject naming strategies', () => {
  it('topic-name — subject = "{topic}-{key|value}"', () => {
    const registry = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'topic-name' });
    expect(registry.subjectFor('orders', 'value')).toBe('orders-value');
    expect(registry.subjectFor('orders', 'key')).toBe('orders-key');
  });

  it('record-name — subject = "{recordName}"', () => {
    const registry = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'record-name' });
    expect(registry.subjectFor('orders', 'value', 'com.acme.Order')).toBe('com.acme.Order');
  });

  it('topic-record-name — subject = "{topic}-{recordName}"', () => {
    const registry = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'topic-record-name' });
    expect(registry.subjectFor('orders', 'value', 'com.acme.Order')).toBe('orders-com.acme.Order');
  });
});
```

### 6. Schema references — Order → Address

`tests/schema-evo/references.test.ts` — a reference is Confluent's `$ref` graph, i.e., a schema can point at another registered schema by `{ name, subject, version }`. The registry validates that every reference resolves at registration time.

```ts
import { describe, expect, it } from 'vitest';
import { createRedpandaSchemaEvolution } from '@kiwa-lab/streaming';

describe('schema references', () => {
  it('registers Address, then Order references Address v1', () => {
    const registry = createRedpandaSchemaEvolution();
    const address = registry.register({
      subject: 'address-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Address","fields":[]}',
    });
    expect(address.version).toBe(1);

    const order = registry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[{"name":"ship_to","type":"Address"}]}',
      references: [{ name: 'Address', subject: 'address-value', version: 1 }],
    });
    expect(order.references).toEqual([{ name: 'Address', subject: 'address-value', version: 1 }]);

    const resolved = registry.resolveReferences(order);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.subject).toBe('address-value');
  });

  it('throws when a reference version is not registered', () => {
    const registry = createRedpandaSchemaEvolution();
    expect(() =>
      registry.register({
        subject: 'orders-value',
        kind: 'avro',
        schema: '{"type":"record","name":"Order"}',
        references: [{ name: 'Address', subject: 'address-value', version: 1 }],
      }),
    ).toThrow(/unknown reference subject/);
  });
});
```

## What you learned

The 5 evolution pieces the tutorial covered — BACKWARD, FORWARD, FULL, subject naming, references — are the ones every Redpanda / Confluent Schema Registry deployment hits within the first 3 months. `@kiwa-lab/streaming` v0.3 models them with structural markers so tests iterate in milliseconds; the fidelity harness (see the concept doc) runs the same assertions against real Redpanda 23+ testcontainers under `KIWA_MODE=real REDPANDA_KEY=...`, which is what the v1.31-3 dogfood app does.

## Next

- Tutorial 58 — Kafka raw protocol (KIP-98 idempotent + txn coordinator + fetch session + ISR)
- Tutorial 60 — NATS JetStream durable consumer (ack_wait + max_deliver + backoff + quarantine)
- Concept — `docs/concepts/streaming-real-driver-testing.md` (8 axis × 3 provider = 24 row grid + testcontainers pattern SSOT)
- Migration — `docs/migrations/v1.30-to-v1.31.md` (streaming v0.2 → v0.3 opt-in surface + no breakage)
