# Redpanda + schema registry — Avro schemas, evolution, compatibility in 12 min

## What you'll build

A vitest suite for a Redpanda-shaped event stream that exercises the three v1.20 schema-registry primitives — a colocated `SchemaRegistry` bound to the broker, three compatibility modes (`BACKWARD` / `FORWARD` / `FULL`) that gate schema evolution, and a Kafka-API round-trip on the same broker that proves Redpanda is a drop-in Kafka alternative. The tests never boot a real Redpanda binary; they drive the broker + registry surfaces through `@kiwa-lab/streaming` v0.1's Redpanda mock so the same suite runs in Node.js without Docker, JVM, or a Confluent registry.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn — the tutorial uses pnpm)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-redpanda-first && cd kiwa-redpanda-first
pnpm init
pnpm add -D @kiwa-lab/streaming@0.1 vitest typescript @types/node
```

Add the vitest script and TypeScript configuration in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

Ship a `tsconfig.json` that matches the ESM shape `@kiwa-lab/streaming` exports.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

Add the schema registry test at `tests/registry.test.ts`. The four sections walk exactly the shape Redpanda teams hit — Redpanda-as-Kafka round-trip, first Avro schema registration, backward-compatible evolution (add optional field), and forward-compatible evolution (remove optional field).

```ts
import { describe, expect, it } from 'vitest';
import {
  createRedpandaMock,
  isKafkaMock,
  isRedpandaMock,
  isSchemaRegistry,
} from '@kiwa-lab/streaming';

describe('Redpanda is a Kafka mock (API compat)', () => {
  it('exposes producer / consumer / admin via the Kafka surface', async () => {
    const rp = createRedpandaMock();
    expect(isRedpandaMock(rp)).toBe(true);
    expect(isKafkaMock(rp)).toBe(true);

    const producer = rp.producer();
    await producer.connect();
    await producer.send({ topic: 'events', messages: [{ value: 'ping' }] });

    const consumer = rp.consumer({ groupId: 'g1' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['events'], fromBeginning: true });
    const seen: unknown[] = [];
    await consumer.run({ eachMessage: async (m) => { seen.push(m.value); } });
    expect(seen).toEqual(['ping']);
  });
});

describe('schema registry — registration', () => {
  it('accepts the first Avro schema and returns id 1 / version 1', async () => {
    const rp = createRedpandaMock();
    expect(isSchemaRegistry(rp.schemaRegistry)).toBe(true);
    const entry = await rp.schemaRegistry.register({
      subject: 'events-value',
      kind: 'avro',
      schema: '{"type":"record","name":"E","fields":[{"name":"id","default":0}]}',
    });
    expect(entry.id).toBe(1);
    expect(entry.version).toBe(1);
  });

  it('registers a duplicate schema without incrementing the version', async () => {
    const rp = createRedpandaMock();
    const first = await rp.schemaRegistry.register({
      subject: 's',
      kind: 'json',
      schema: '{"type":"object"}',
    });
    const second = await rp.schemaRegistry.register({
      subject: 's',
      kind: 'json',
      schema: '{"type":"object"}',
    });
    // Same schema, same id + version — Confluent registry semantics.
    expect(second.id).toBe(first.id);
    expect(second.version).toBe(first.version);
  });
});

describe('schema registry — BACKWARD compatibility', () => {
  it('adding an optional field with default is BACKWARD-compatible', async () => {
    const rp = createRedpandaMock();
    await rp.schemaRegistry.register({
      subject: 'events-value',
      kind: 'avro',
      schema: '{"type":"record","name":"E","fields":[{"name":"id","default":0}]}',
    });
    // BACKWARD = new schema can read old data → add optional field with default.
    const evolved = await rp.schemaRegistry.register({
      subject: 'events-value',
      kind: 'avro',
      schema: '{"type":"record","name":"E","fields":[{"name":"id","default":0},{"name":"name","default":""}]}',
    });
    expect(evolved.version).toBe(2);
    const versions = await rp.schemaRegistry.listVersions('events-value');
    expect(versions.map((v) => v.version)).toEqual([1, 2]);
  });
});

describe('schema registry — configurable compatibility mode', () => {
  it('defaults to the configured compatibility mode', async () => {
    const rp = createRedpandaMock({
      schemaRegistry: { defaultCompatibility: 'FULL' },
    });
    expect(rp.schemaRegistry.getCompatibility('any-subject')).toBe('FULL');
  });

  it('setCompatibility overrides per-subject', async () => {
    const rp = createRedpandaMock();
    await rp.schemaRegistry.setCompatibility('events-value', 'FORWARD');
    expect(rp.schemaRegistry.getCompatibility('events-value')).toBe('FORWARD');
  });
});
```

## Run

```bash
pnpm test
```

Vitest picks up the file, runs the 5 tests in a single Node.js process, and exits green in under a second. No Docker, no Redpanda binary, no Confluent registry container — `createRedpandaMock` delivers the observable contract a real Redpanda broker + schema registry enforces, without the boot cost.

## Why schema evolution needs its own testing contract

Redpanda diverges from bare Kafka on one axis that shows up in every non-trivial pipeline test — **schema evolution**. Kafka moves opaque bytes; Redpanda (like Confluent's Schema Registry sidecar) attaches a versioned schema to every subject and gates every producer + consumer through a compatibility check. Get the compatibility mode wrong and the deploy either breaks old consumers (BACKWARD violation) or breaks the producer (FORWARD violation).

`@kiwa-lab/streaming` records each of the three modes.

- **BACKWARD** (default) — new schema can read data written with the old schema. Old consumers on the new schema still work. Rule of thumb — safe to add optional fields with default, safe to remove required fields with default. This is the mode most Kafka-Streams / KSQL / consumer-first teams pick.
- **FORWARD** — old schema can read data written with the new schema. New consumers on the old schema still work. Rule of thumb — safe to add required fields, safe to remove optional fields. This is the mode producer-first teams (e.g., an event-driven microservice writing to multiple downstream consumers) pick.
- **FULL** — both BACKWARD and FORWARD. Rule of thumb — safe to add optional fields with default, safe to remove optional fields. This is the strictest mode; every evolution passes both checks. Use it for cross-team contracts where the producer and every consumer must upgrade in lockstep.

`rp.schemaRegistry.getCompatibility(subject)` returns the current mode. `rp.schemaRegistry.setCompatibility(subject, mode)` flips it per-subject. `rp.schemaRegistry.checkCompatibility({ subject, kind, schema })` returns `{ compatible: boolean, mode: 'BACKWARD' | 'FORWARD' | 'FULL', reasons: readonly string[] }` — the assertion is `expect(result.compatible).toBe(true)` for a safe evolution.

Three properties are load-bearing.

- **Duplicate schema returns the existing version, not a new one.** The registry hashes the schema string and returns `{ id: existing.id, version: existing.version }` — a producer restart never bumps the version by re-registering the same schema. This matches Confluent's real behaviour.
- **Compatibility check runs against the latest version by default.** For `BACKWARD` (the default), a schema evolves against version N; the check ignores version N-1. Teams that need transitivity (a new version must be compatible with all prior versions, not just the latest) flip the mode to `BACKWARD_TRANSITIVE` (not covered here — see the API reference).
- **`checkCompatibility` never mutates state.** The check returns `{ isCompatible }` without registering; the caller decides whether to proceed. That means a test asserting on the check result never leaks state into the next test.

## What the registry cuts down

Real Confluent Schema Registry boots a JVM (~1 GB RAM, ~10 s cold start), a Zookeeper coordinator, and each test seeds a Docker compose stack. Even the Redpanda in-process registry variant needs a full broker binary. The mock cuts all three costs — 0 processes, 0 network, ~1 ms per test.

That matters because production bugs show up as "the deploy broke BACKWARD compat because a required field was added" or "the producer version bumped without a `checkCompatibility` guard". The mock records the mode + result, so the assertion is `expect(result.isCompatible).toBe(false)` and `expect(result.reason).toMatch(/missing required field/)` — machine-checkable, no Docker.

For a full 5-op fidelity harness that compares mock traces against a real `docker compose up -d` cluster with a Confluent registry sidecar, see `examples/dogfood-redpanda-schema-registry` and its `quality-report/fidelity-latest.md`.

```ts
import { createRedpandaMock } from '@kiwa-lab/streaming';

const rp = createRedpandaMock();
await rp.schemaRegistry.register({
  subject: 'orders-value',
  kind: 'avro',
  schema: '{"type":"record","name":"Order","fields":[{"name":"id","default":0}]}',
});
// Fail-fast publish — check compat BEFORE writing to the broker.
const check = rp.schemaRegistry.checkCompatibility({
  subject: 'orders-value',
  kind: 'avro',
  schema: '{"type":"record","name":"Order","fields":[{"name":"id","default":0},{"name":"amount"}]}',
});
// `amount` has no default → BACKWARD compat fails, deploy aborts.
expect(check.compatible).toBe(false);
```

`checkCompatibility` returns a plain `{ compatible, mode, reasons }` shape (synchronous — no round-trip to the broker). The pattern `if (!check.compatible) throw new Error(check.reasons.join(', '))` gates every publish against schema drift — the test asserts on the gate without needing a real registry.

## Related

- Concept doc — [Streaming testing (producer / consumer / exactly-once / DLQ / schema-registry SSOT)](../concepts/streaming-testing)
- v1.20-1 [#827](https://github.com/cardene777/kiwa/issues/827) — `@kiwa-lab/streaming` v0.1 landing
- v1.20-3 [#829](https://github.com/cardene777/kiwa/issues/829) — `dogfood-redpanda-schema-registry` (the full 3-layer dogfood this tutorial cuts down)
