import { createNatsMock } from '@kiwa-lab/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createRoutingRun } from '../src/routing/index.js';

let nats: ReturnType<typeof createNatsMock> | null = null;

afterEach(() => {
  nats?.reset();
  nats = null;
});

function makeNats() {
  nats = createNatsMock({ name: 'routing-test' });
  return nats;
}

describe('routing — literal + wildcard + catch-all + queue group', () => {
  it('T-DNR-001 literal subject delivers only exact matches', async () => {
    const client = makeNats();
    const routing = createRoutingRun({ nats: client });
    let count = 0;
    routing.subscribe({
      label: 'lit',
      subject: 'events.audit',
      handler: async () => {
        count += 1;
      },
    });
    await routing.publish('events.audit', { a: 1 });
    await routing.publish('events.signup', { a: 2 });
    expect(count).toBe(1);
  });

  it('T-DNR-002 `*` matches a single token', async () => {
    const client = makeNats();
    const routing = createRoutingRun({ nats: client });
    let hits = 0;
    routing.subscribe({
      label: 'wild',
      subject: 'events.*',
      handler: async () => {
        hits += 1;
      },
    });
    await routing.publish('events.audit', {});
    await routing.publish('events.signup', {});
    // `events.audit.write` is 3 tokens — `*` does not match beyond 1.
    await routing.publish('events.audit.write', {});
    expect(hits).toBe(2);
  });

  it('T-DNR-003 `>` catch-all matches every trailing token', async () => {
    const client = makeNats();
    const routing = createRoutingRun({ nats: client });
    let hits = 0;
    routing.subscribe({
      label: 'catch',
      subject: 'events.>',
      handler: async () => {
        hits += 1;
      },
    });
    await routing.publish('events.audit', {});
    await routing.publish('events.audit.write', {});
    await routing.publish('events.a.b.c', {});
    expect(hits).toBe(3);
  });

  it('T-DNR-004 queue group shares deliveries via round-robin', async () => {
    const client = makeNats();
    const routing = createRoutingRun({ nats: client });
    const perWorker: Record<string, number> = { w0: 0, w1: 0, w2: 0 };
    for (const [idx, key] of ['w0', 'w1', 'w2'].entries()) {
      routing.subscribe({
        label: key,
        subject: 'events.queue',
        queue: 'workers',
        handler: async () => {
          perWorker[key] = (perWorker[key] ?? 0) + 1;
        },
      });
      void idx;
    }
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await routing.publish('events.queue', { i });
    }
    // Round-robin over 3 workers with 6 messages = 2 apiece.
    expect(perWorker.w0).toBe(2);
    expect(perWorker.w1).toBe(2);
    expect(perWorker.w2).toBe(2);
  });

  it('T-DNR-005 queueGroupSizes reports the number of members per group', async () => {
    const client = makeNats();
    const routing = createRoutingRun({ nats: client });
    for (const label of ['a', 'b', 'c']) {
      routing.subscribe({
        label,
        subject: 'events.queue',
        queue: 'workers',
        handler: async () => undefined,
      });
    }
    routing.subscribe({
      label: 'solo',
      subject: 'events.other',
      queue: 'others',
      handler: async () => undefined,
    });
    expect(routing.queueGroupSizes()['events.queue::workers']).toBe(3);
    expect(routing.queueGroupSizes()['events.other::others']).toBe(1);
  });

  it('T-DNR-006 deliveries() surfaces subject + value + queue for each hit', async () => {
    const client = makeNats();
    const routing = createRoutingRun({ nats: client });
    routing.subscribe({
      label: 'x',
      subject: 'events.audit',
      handler: async () => undefined,
    });
    await routing.publish('events.audit', { at: 42 });
    const deliveries = routing.deliveries();
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.subject).toBe('events.audit');
    expect(deliveries[0]?.value).toEqual({ at: 42 });
    expect(deliveries[0]?.queue).toBeUndefined();
  });
});
