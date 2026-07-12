import { describe, expect, it } from 'vitest';
import { createNatsMock } from '../src/index.js';

// Follow-up file — closes the reset(), getSubjectMessages, drain(), object
// store delete / list, kv watch, jetstream `no stream / no consumer` errors,
// and request-with-no-reply branches that nats.test.ts leaves open.

describe('createNatsMock lifecycle + accessors', () => {
  it('T-NATS-B-001 reset() clears subscriptions, messages, and JetStream state', async () => {
    const nats = createNatsMock();
    const seen: unknown[] = [];
    nats.subscribe('orders.>', (m) => {
      seen.push(m.value);
    });
    await nats.publish('orders.a', 1);
    const js = nats.jetstream();
    await js.addStream({ name: 'S', subjects: ['s.>'] });
    await js.publish('s.a', 'x');
    // reset drops everything.
    nats.reset();
    // Republish — no delivery reaches the pre-reset subscription.
    await nats.publish('orders.a', 2);
    expect(seen).toEqual([1]);
    // JetStream stream is gone.
    expect(js.listStreams()).toEqual([]);
    expect(js.getStreamMessages('S')).toEqual([]);
  });

  it('T-NATS-B-001a publish forwards explicit headers via options.headers', async () => {
    const nats = createNatsMock();
    const seen: Record<string, string>[] = [];
    nats.subscribe('rpc.h', (m) => {
      seen.push(m.headers);
    });
    await nats.publish('rpc.h', 'body', { headers: { 'x-trace': 't1' } });
    expect(seen[0]?.['x-trace']).toBe('t1');
  });

  it('T-NATS-B-002 getSubjectMessages filters buffered messages via subject pattern', async () => {
    const nats = createNatsMock();
    await nats.publish('orders.a', 1);
    await nats.publish('orders.b', 2);
    await nats.publish('users.c', 3);
    expect(nats.getSubjectMessages('orders.>').map((m) => m.value)).toEqual([1, 2]);
    expect(nats.getSubjectMessages('users.*').map((m) => m.value)).toEqual([3]);
  });

  it('T-NATS-B-003 drain() flips every subscription to inactive', async () => {
    const nats = createNatsMock();
    const seen: unknown[] = [];
    const a = nats.subscribe('a', (m) => {
      seen.push(m.value);
    });
    const b = nats.subscribe('b', (m) => {
      seen.push(m.value);
    });
    await nats.drain();
    expect(a.isClosed()).toBe(true);
    expect(b.isClosed()).toBe(true);
    await nats.publish('a', 'never');
    await nats.publish('b', 'never');
    expect(seen).toEqual([]);
  });
});

describe('createNatsMock KV + Object store surface', () => {
  it('T-NATS-B-004 kv.watch yields every stored revision', async () => {
    const nats = createNatsMock();
    const kv = nats.kv('sessions');
    await kv.put('a', 1);
    await kv.put('b', 2);
    const seen: unknown[] = [];
    for await (const entry of kv.watch()) seen.push(entry.value);
    expect(seen.sort()).toEqual([1, 2]);
  });

  it('T-NATS-B-005a objectStore.put accepts raw Uint8Array data (non-string branch)', async () => {
    const nats = createNatsMock();
    const store = nats.objectStore('files');
    const raw = new Uint8Array([0xa, 0xb, 0xc]);
    const info = await store.put('bin', raw);
    expect(info.size).toBe(3);
    const entry = await store.get('bin');
    expect(Array.from(entry?.data ?? [])).toEqual([0xa, 0xb, 0xc]);
  });

  it('T-NATS-B-005 objectStore.delete removes a file and get returns null after', async () => {
    const nats = createNatsMock();
    const store = nats.objectStore('files');
    await store.put('a.txt', 'a');
    await store.delete('a.txt');
    expect(await store.get('a.txt')).toBeNull();
    expect(await store.list()).toEqual([]);
  });

  it('T-NATS-B-006 objectStore.get returns null for an unknown name', async () => {
    const nats = createNatsMock();
    const store = nats.objectStore('files');
    expect(await store.get('missing.bin')).toBeNull();
  });
});

describe('createNatsMock JetStream error surface', () => {
  it('T-NATS-B-007 addStream with zero subjects rejects', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await expect(js.addStream({ name: 'S', subjects: [] })).rejects.toThrow(/at least one subject/);
  });

  it('T-NATS-B-008 publish to an unknown stream subject rejects', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await expect(js.publish('nowhere.x', 'x')).rejects.toThrow(/no stream matches/);
  });

  it('T-NATS-B-009 consumer() on an unknown stream rejects', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await expect(js.consumer('missing', { durable: 'c' })).rejects.toThrow(/stream "missing" not found/);
  });

  it('T-NATS-B-010 fetch respects the batch cap and clears pending on ack', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await js.addStream({ name: 'S', subjects: ['s.>'] });
    for (const v of [1, 2, 3, 4]) await js.publish('s.x', v);
    const consumer = await js.consumer('S', { durable: 'c1' });
    const batch = await consumer.fetch(2);
    expect(batch).toHaveLength(2);
    // Ack the first — pending drops but ackFloor waits for the second.
    consumer.ack(batch[0]!);
    expect(consumer.info().ackFloor).toBe(0);
    consumer.ack(batch[1]!);
    expect(consumer.info().ackFloor).toBe(2);
  });

  it('T-NATS-B-011 fetch with filterSubject skips non-matching messages', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await js.addStream({ name: 'S', subjects: ['s.>'] });
    await js.publish('s.a', 'a-msg');
    await js.publish('s.b', 'b-msg');
    const consumer = await js.consumer('S', { durable: 'c1', filterSubject: 's.b' });
    const batch = await consumer.fetch(10);
    expect(batch.map((m) => m.value)).toEqual(['b-msg']);
  });
});

describe('createNatsMock request/reply', () => {
  it('T-NATS-B-012 request with no reply rejects', async () => {
    const nats = createNatsMock();
    await expect(nats.request('rpc.silent', 'hello')).rejects.toThrow(/received no reply/);
  });

  it('T-NATS-B-013 request roundtrip picks up the first reply via the inbox subject', async () => {
    const nats = createNatsMock();
    nats.subscribe('rpc.echo', async (msg) => {
      const inbox = msg.headers['reply-to'];
      if (typeof inbox === 'string') {
        await nats.publish(inbox, `echo:${String(msg.value)}`);
      }
    });
    const reply = await nats.request('rpc.echo', 'hi');
    expect(reply.value).toBe('echo:hi');
  });
});
