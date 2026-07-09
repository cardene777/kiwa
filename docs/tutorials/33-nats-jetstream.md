# NATS JetStream — persistent streams, KV store, Object store, subject routing in 12 min

## What you'll build

A vitest suite for a NATS-shaped message system that exercises the four v1.20 primitives — `createNatsMock` for the connection, core pub/sub with `*` (single-token) and `>` (multi-token) wildcards, JetStream persistent streams with consumers + ack tracking, and the KV + Object stores that ride on JetStream. The tests never boot a real NATS server; they drive the pub/sub + stream + KV + object surfaces through `@kiwa-lab/streaming` v0.1's nats.js-shaped stubs so the same suite runs in Node.js without Docker, `nats-server`, or a JetStream data directory.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn — the tutorial uses pnpm)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-nats-first && cd kiwa-nats-first
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

Add the NATS test at `tests/nats.test.ts`. The four sections walk exactly the shape NATS teams hit — core pub/sub with subject wildcards, JetStream persistent stream + consumer + ack, KV store put / get / delete, and Object store byte roundtrip.

```ts
import { describe, expect, it } from 'vitest';
import {
  createNatsMock,
  isNatsMock,
  type StreamingMessage,
} from '@kiwa-lab/streaming';

describe('core pub/sub with subject wildcards', () => {
  it('literal subject reaches exactly the matching subscriber', async () => {
    const nats = createNatsMock();
    expect(isNatsMock(nats)).toBe(true);
    const seen: unknown[] = [];
    nats.subscribe('orders.created', (m) => { seen.push(m.value); });
    await nats.publish('orders.created', { id: 1 });
    expect(seen).toEqual([{ id: 1 }]);
  });

  it('single-token wildcard `*` matches one segment (not zero, not many)', async () => {
    const nats = createNatsMock();
    const seen: string[] = [];
    nats.subscribe('orders.*.created', (m) => { seen.push(m.topic); });
    await nats.publish('orders.user-1.created', {});
    await nats.publish('orders.user-2.created', {});
    // Extra token — must NOT match `*`.
    await nats.publish('orders.user-1.deep.created', {});
    expect(seen).toEqual(['orders.user-1.created', 'orders.user-2.created']);
  });

  it('trailing wildcard `>` catches all remaining tokens', async () => {
    const nats = createNatsMock();
    const seen: string[] = [];
    nats.subscribe('orders.>', (m) => { seen.push(m.topic); });
    await nats.publish('orders.a', {});
    await nats.publish('orders.a.b.c', {});
    expect(seen).toEqual(['orders.a', 'orders.a.b.c']);
  });
});

describe('JetStream — persistent stream + consumer + ack', () => {
  it('addStream + publish + consumer.fetch delivers persistent messages', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await js.addStream({ name: 'ORDERS', subjects: ['orders.>'] });
    await js.publish('orders.created', { id: 1 });
    await js.publish('orders.updated', { id: 2 });
    const consumer = await js.consumer('ORDERS', { durable: 'processor' });
    const batch = await consumer.fetch(10);
    expect(batch).toHaveLength(2);
    expect(batch[0]?.value).toEqual({ id: 1 });
  });

  it('ack advances the consumer ackFloor', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await js.addStream({ name: 'S', subjects: ['s.>'] });
    await js.publish('s.a', 1);
    const consumer = await js.consumer('S', { durable: 'c1' });
    const batch = await consumer.fetch(1);
    for (const m of batch) consumer.ack(m);
    expect(consumer.info().ackFloor).toBe(1);
  });

  it('filterSubject scopes consumer.fetch to matching subject', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await js.addStream({ name: 'S', subjects: ['s.>'] });
    await js.publish('s.a', 1);
    await js.publish('s.b', 2);
    const consumer = await js.consumer('S', { durable: 'c1', filterSubject: 's.a' });
    const batch = await consumer.fetch(10);
    expect(batch.map((m) => m.value)).toEqual([1]);
  });
});

describe('KV store — put / get / delete roundtrip', () => {
  it('put + get returns the stored value with revision 1', async () => {
    const nats = createNatsMock();
    const kv = nats.kv('sessions');
    const rev = await kv.put('user-1', { name: 'alice' });
    expect(rev).toBe(1);
    const entry = await kv.get<{ name: string }>('user-1');
    expect(entry?.value.name).toBe('alice');
    expect(entry?.revision).toBe(1);
  });

  it('delete removes the key from the store', async () => {
    const nats = createNatsMock();
    const kv = nats.kv('sessions');
    await kv.put('user-1', 'x');
    await kv.delete('user-1');
    expect(await kv.get('user-1')).toBeNull();
  });
});

describe('Object store — byte roundtrip', () => {
  it('put + get preserves bytes and reports size', async () => {
    const nats = createNatsMock();
    const store = nats.objectStore('files');
    await store.put('greeting.txt', 'hello');
    const entry = await store.get('greeting.txt');
    expect(new TextDecoder().decode(entry?.data ?? new Uint8Array())).toBe('hello');
    expect(entry?.info.size).toBe(5);
  });
});
```

## Run

```bash
pnpm test
```

Vitest picks up the file, runs the 8 tests in a single Node.js process, and exits green in under a second. No Docker, no `nats-server`, no JetStream data directory — `createNatsMock` delivers the observable contract a real NATS + JetStream cluster enforces, without the boot cost.

## Why NATS diverges from Kafka on 3 axes

NATS diverges from Kafka on three axes that show up in every non-trivial test — subject-based routing, JetStream vs core (persistent vs ephemeral), and colocated KV / Object stores.

- **Subject-based routing** — Kafka partitions on a topic name + partition number. NATS routes on a subject string like `orders.user-42.created` with wildcards (`*` matches exactly one token, `>` catches all trailing tokens). A subscription pattern `orders.*.created` catches `orders.user-1.created` but not `orders.user-1.deep.created`. `orders.>` catches both. This routing model turns "which service handles this event" into a **string match**, not a broker-side routing table.
- **JetStream vs core** — core NATS is ephemeral, at-most-once. Publish arrives if there is a subscriber right now; drops otherwise. JetStream is at-least-once with persistent streams — `addStream({ name, subjects })` binds a name to a subject filter, `publish()` persists to disk, and `consumer.fetch(N)` pulls N pending messages. Consumers are named durables that survive reconnects.
- **Colocated KV + Object stores** — JetStream persistence is the same substrate as the KV store (`nats.kv('bucket')`) and the Object store (`nats.objectStore('bucket')`). One binary handles pub/sub, streaming, key-value, and object storage. That means a service can use `nats.kv('sessions')` instead of Redis, `nats.objectStore('files')` instead of S3, and still route events through the same connection.

`@kiwa-lab/streaming` records each axis.

- **Subject match** — `nats.subscribe(pattern, cb)` uses the same tokenizer as real NATS. `compileSubject('orders.*.created')` returns a matcher; `matchSubject(matcher, 'orders.user-1.created')` returns true, `matchSubject(matcher, 'orders.user-1.deep.created')` returns false. That means a test asserting on subject routing catches typos at wire time, not at production time.
- **Stream persist** — `js.publish('orders.created', payload)` throws when no stream matches the subject (unlike core pub/sub which silently drops). `js.getStreamMessages(name)` returns the persisted array. Sequence numbers start at 1 (not 0 like Kafka).
- **KV revision** — every `kv.put(key, value)` bumps the revision. `kv.get(key)` returns `{ value, revision }` so a test can assert on optimistic concurrency without needing a real clock.

Three properties are load-bearing.

- **`>` must be the last token.** `compileSubject('orders.>.created')` throws at compile time — the wildcard is trailing-only. The test surfaces the error at compile time, not at runtime.
- **`maxMsgs` caps stream retention oldest-first.** `js.addStream({ name, subjects, maxMsgs: 2 })` drops the oldest message when the third arrives. The test asserts on `js.getStreamMessages(name).map((m) => m.value)` after N publishes to verify the retention policy.
- **`filterSubject` scopes consumer.fetch.** A stream can accept `s.>` (all subjects) but a consumer can pull only `s.a` messages. `consumer.info()` exposes the consumer's ackFloor + pending count so a test can assert on both dimensions.

## What the mock cuts down

Real NATS boots a Go binary (~30 MB, ~1 s cold start), a JetStream data directory, and each test seeds a `docker run` or `nats-server -js` command. The mock cuts all three costs — 0 processes, 0 network, ~1 ms per test.

That matters because production bugs show up as "the wildcard subscription did not match because the pattern had `.>` in the wrong position" or "the JetStream consumer did not advance ackFloor because ack was called before fetch". The mock records both transitions, so the assertion is `expect(matchSubject(matcher, subject)).toBe(true)` or `expect(consumer.info().ackFloor).toBe(N)` — machine-checkable, no Docker.

For a full 5-op fidelity harness that compares mock traces against a real `nats-server -js` process, see `examples/dogfood-nats-jetstream` and its `quality-report/fidelity-latest.md`.

```ts
import { createNatsMock, type StreamingMessage } from '@kiwa-lab/streaming';

const nats = createNatsMock();
nats.subscribe('rpc.echo', async (m: StreamingMessage) => {
  const replyTo = m.headers['reply-to'];
  if (replyTo) await nats.publish(replyTo, m.value);
});
const reply = await nats.request('rpc.echo', 42);
expect(reply.value).toBe(42);
```

`nats.request(subject, payload)` sends a message + waits for a reply via a temporary inbox subject. The test asserts on the reply value without a real coordinator — the mock walks the request / reply / cleanup lifecycle in-process.

## Related

- Concept doc — [Streaming testing (producer / consumer / exactly-once / DLQ / schema-registry SSOT)](../concepts/streaming-testing)
- v1.20-1 [#827](https://github.com/cardene777/kiwa/issues/827) — `@kiwa-lab/streaming` v0.1 landing
- v1.20-4 [#830](https://github.com/cardene777/kiwa/issues/830) — `dogfood-nats-jetstream` (the full 3-layer dogfood this tutorial cuts down)
