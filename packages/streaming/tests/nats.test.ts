import { describe, expect, it } from 'vitest';
import {
  compileSubject,
  createNatsMock,
  isNatsMock,
  matchSubject,
  type StreamingMessage,
} from '../src/index.js';

describe('createNatsMock (core pub/sub)', () => {
  it('T-NATS-001 pub reaches a literal-subject subscriber', async () => {
    const nats = createNatsMock();
    const seen: unknown[] = [];
    nats.subscribe('orders.created', (m) => { seen.push(m.value); });
    await nats.publish('orders.created', { id: 1 });
    expect(seen).toEqual([{ id: 1 }]);
  });

  it('T-NATS-002 wildcard `*` matches a single token', async () => {
    const nats = createNatsMock();
    const seen: string[] = [];
    nats.subscribe('orders.*.created', (m) => { seen.push(m.topic); });
    await nats.publish('orders.user-1.created', {});
    await nats.publish('orders.user-2.created', {});
    // Extra token — should NOT match `*`.
    await nats.publish('orders.user-1.deep.created', {});
    expect(seen).toEqual(['orders.user-1.created', 'orders.user-2.created']);
  });

  it('T-NATS-003 wildcard `>` catches all trailing tokens', async () => {
    const nats = createNatsMock();
    const seen: string[] = [];
    nats.subscribe('orders.>', (m) => { seen.push(m.topic); });
    await nats.publish('orders.a', {});
    await nats.publish('orders.a.b.c', {});
    expect(seen).toEqual(['orders.a', 'orders.a.b.c']);
  });

  it('T-NATS-004 unsubscribe stops future delivery', async () => {
    const nats = createNatsMock();
    const seen: unknown[] = [];
    const sub = nats.subscribe('orders.created', (m) => { seen.push(m.value); });
    await nats.publish('orders.created', 1);
    sub.unsubscribe();
    await nats.publish('orders.created', 2);
    expect(seen).toEqual([1]);
    expect(sub.isClosed()).toBe(true);
  });

  it('T-NATS-005 `>` in a non-terminal position throws at compile time', () => {
    expect(() => compileSubject('orders.>.created')).toThrow(/last token/);
  });

  it('T-NATS-006 request/reply resolves via _INBOX', async () => {
    const nats = createNatsMock();
    nats.subscribe('rpc.echo', async (m: StreamingMessage) => {
      const replyTo = m.headers['reply-to'];
      if (replyTo) await nats.publish(replyTo, m.value);
    });
    const reply = await nats.request('rpc.echo', 42);
    expect(reply.value).toBe(42);
  });

  it('T-NATS-007 request throws when no responder replies', async () => {
    const nats = createNatsMock();
    await expect(nats.request('rpc.silent', {})).rejects.toThrow(/no reply/);
  });
});

describe('createNatsMock (JetStream)', () => {
  it('T-NATS-008 addStream + publish + consumer.fetch delivers persistent messages', async () => {
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

  it('T-NATS-009 stream publish throws for unknown subject', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await js.addStream({ name: 'ORDERS', subjects: ['orders.>'] });
    await expect(js.publish('users.created', {})).rejects.toThrow(/no stream matches/);
  });

  it('T-NATS-010 addStream requires at least one subject', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await expect(js.addStream({ name: 'S', subjects: [] })).rejects.toThrow(/at least one subject/);
  });

  it('T-NATS-011 consumer.ack advances ackFloor when all pending acked', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await js.addStream({ name: 'S', subjects: ['s.>'] });
    await js.publish('s.a', 1);
    const consumer = await js.consumer('S', { durable: 'c1' });
    const batch = await consumer.fetch(1);
    for (const m of batch) consumer.ack(m);
    expect(consumer.info().ackFloor).toBe(1);
  });

  it('T-NATS-012 maxMsgs caps stream retention (oldest first)', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await js.addStream({ name: 'S', subjects: ['s.>'], maxMsgs: 2 });
    await js.publish('s.a', 1);
    await js.publish('s.a', 2);
    await js.publish('s.a', 3);
    const messages = js.getStreamMessages('S');
    expect(messages).toHaveLength(2);
    expect(messages.map((m) => m.value)).toEqual([2, 3]);
  });

  it('T-NATS-013 filterSubject scopes consumer.fetch to matching subject', async () => {
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

describe('createNatsMock (KV store)', () => {
  it('T-NATS-014 kv put + get roundtrip returns the stored value', async () => {
    const nats = createNatsMock();
    const kv = nats.kv('sessions');
    const rev = await kv.put('user-1', { name: 'alice' });
    expect(rev).toBe(1);
    const entry = await kv.get<{ name: string }>('user-1');
    expect(entry?.value.name).toBe('alice');
    expect(entry?.revision).toBe(1);
  });

  it('T-NATS-015 kv delete removes the key', async () => {
    const nats = createNatsMock();
    const kv = nats.kv('sessions');
    await kv.put('user-1', 'x');
    await kv.delete('user-1');
    expect(await kv.get('user-1')).toBeNull();
  });

  it('T-NATS-016 kv keys() lists all present keys', async () => {
    const nats = createNatsMock();
    const kv = nats.kv('sessions');
    await kv.put('a', 1);
    await kv.put('b', 2);
    expect((await kv.keys()).sort()).toEqual(['a', 'b']);
  });
});

describe('createNatsMock (Object store)', () => {
  it('T-NATS-017 object put + get roundtrip preserves bytes', async () => {
    const nats = createNatsMock();
    const store = nats.objectStore('files');
    await store.put('greeting.txt', 'hello');
    const entry = await store.get('greeting.txt');
    expect(new TextDecoder().decode(entry?.data ?? new Uint8Array())).toBe('hello');
    expect(entry?.info.size).toBe(5);
  });

  it('T-NATS-018 object list returns registered files', async () => {
    const nats = createNatsMock();
    const store = nats.objectStore('files');
    await store.put('a.txt', 'a');
    await store.put('b.txt', 'b');
    const list = await store.list();
    expect(list.map((i) => i.name).sort()).toEqual(['a.txt', 'b.txt']);
  });
});

describe('subject matching', () => {
  it('T-NATS-019 matchSubject rejects non-matching topic', () => {
    const matcher = compileSubject('orders.*');
    expect(matchSubject(matcher, 'users.created')).toBe(false);
  });

  it('T-NATS-020 isNatsMock rejects non-mocks', () => {
    expect(isNatsMock({})).toBe(false);
    expect(isNatsMock(null)).toBe(false);
  });
});
