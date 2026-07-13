/**
 * fidelity test — `docs/concepts/test-taxonomy.md § fidelity` pattern。
 *
 * RealtimeEngine (kiwa realtime mock engine) が、 想定 reference impl
 * (subscribe → publish 経路の in-memory pubsub) と同じ event 配信 semantics を
 * 返すことを保証する。 mock ≠ real Supabase / Ably / Pusher 比較の live fidelity は
 * `*.real.fidelity.test.ts` 経路 (現状 scope 外)。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { RealtimeEngine } from '../../src/index.js';

/** Reference impl = in-memory pubsub。 */
function referencePubsub() {
  const handlers = new Map<string, Array<(event: string, payload: unknown) => void>>();
  return {
    async subscribe(channel: string, handler: (event: string, payload: unknown) => void): Promise<void> {
      const list = handlers.get(channel) ?? [];
      list.push(handler);
      handlers.set(channel, list);
    },
    async publish(channel: string, event: string, payload: unknown): Promise<void> {
      const list = handlers.get(channel) ?? [];
      for (const h of list) h(event, payload);
    },
  };
}

describe('RealtimeEngine fidelity vs reference in-memory pubsub', () => {
  it('subscribe → publish で handler が呼ばれる (mock ↔ reference 一致)', async () => {
    const mock = new RealtimeEngine({ artificialLatencyMs: 0 });
    const real = referencePubsub();

    const mockReceived: string[] = [];
    const realReceived: string[] = [];
    await mock.subscribe('ch', (evt) => {
      if (evt.kind === 'broadcast' && typeof evt.payload === 'string') {
        mockReceived.push(evt.payload);
      }
    });
    await real.subscribe('ch', (_event, payload) => {
      if (typeof payload === 'string') realReceived.push(payload);
    });

    await mock.publish('ch', 'msg', 'hello');
    await real.publish('ch', 'msg', 'hello');

    const result = await assertFidelity({
      mockFn: async () => mockReceived,
      realFn: async () => realReceived,
      cases: [{ name: 'publish 1 件で handler 1 回呼出', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);

    await mock.disconnect();
  });

  it('複数 publish が挿入順に配信される (mock ↔ reference 一致)', async () => {
    const mock = new RealtimeEngine({ artificialLatencyMs: 0 });
    const real = referencePubsub();

    const mockReceived: string[] = [];
    const realReceived: string[] = [];
    await mock.subscribe('ch', (evt) => {
      if (evt.kind === 'broadcast' && typeof evt.payload === 'string') mockReceived.push(evt.payload);
    });
    await real.subscribe('ch', (_e, p) => {
      if (typeof p === 'string') realReceived.push(p);
    });

    for (const payload of ['a', 'b', 'c']) {
      await mock.publish('ch', 'msg', payload);
      await real.publish('ch', 'msg', payload);
    }

    const result = await assertFidelity({
      mockFn: async () => mockReceived,
      realFn: async () => realReceived,
      cases: [{ name: '複数 publish 順序', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.failed).toBe(0);

    await mock.disconnect();
  });

  it('subscribe されていない channel への publish で他 channel handler は呼ばれない', async () => {
    const mock = new RealtimeEngine({ artificialLatencyMs: 0 });
    const real = referencePubsub();

    const mockReceived: string[] = [];
    const realReceived: string[] = [];
    await mock.subscribe('ch-A', (evt) => {
      if (evt.kind === 'broadcast' && typeof evt.payload === 'string') mockReceived.push(evt.payload);
    });
    await real.subscribe('ch-A', (_e, p) => {
      if (typeof p === 'string') realReceived.push(p);
    });

    await mock.publish('ch-B', 'msg', 'not-for-A');
    await real.publish('ch-B', 'msg', 'not-for-A');

    const result = await assertFidelity({
      mockFn: async () => mockReceived,
      realFn: async () => realReceived,
      cases: [{ name: 'ch-A に届かない', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);

    await mock.disconnect();
  });

  it('複数 subscriber 全員に broadcast (両実装 fan-out)', async () => {
    const mock = new RealtimeEngine({ artificialLatencyMs: 0 });
    const real = referencePubsub();

    const mockA: string[] = [];
    const mockB: string[] = [];
    const realA: string[] = [];
    const realB: string[] = [];

    await mock.subscribe('ch', (e) => {
      if (e.kind === 'broadcast' && typeof e.payload === 'string') mockA.push(e.payload);
    });
    await mock.subscribe('ch', (e) => {
      if (e.kind === 'broadcast' && typeof e.payload === 'string') mockB.push(e.payload);
    });
    await real.subscribe('ch', (_e, p) => {
      if (typeof p === 'string') realA.push(p);
    });
    await real.subscribe('ch', (_e, p) => {
      if (typeof p === 'string') realB.push(p);
    });

    await mock.publish('ch', 'msg', 'fan-out');
    await real.publish('ch', 'msg', 'fan-out');

    expect(mockA).toEqual(['fan-out']);
    expect(mockB).toEqual(['fan-out']);
    expect(realA).toEqual(['fan-out']);
    expect(realB).toEqual(['fan-out']);

    await mock.disconnect();
  });

  it('disconnect 後 = publish は不発 (両実装 lifecycle 契約)', async () => {
    const mock = new RealtimeEngine({ artificialLatencyMs: 0 });

    const received: string[] = [];
    await mock.subscribe('ch', (e) => {
      if (e.kind === 'broadcast' && typeof e.payload === 'string') received.push(e.payload);
    });

    await mock.disconnect();
    // disconnect 後の publish は pending queue に積まれるが handler に届かない
    await mock.publish('ch', 'msg', 'after-disconnect');

    expect(received.length).toBe(0);
  });

  it('別 channel は完全独立 (channel 間 crossover なし)', async () => {
    const mock = new RealtimeEngine({ artificialLatencyMs: 0 });

    const chA: string[] = [];
    const chB: string[] = [];
    await mock.subscribe('ch-A', (e) => {
      if (e.kind === 'broadcast' && typeof e.payload === 'string') chA.push(e.payload);
    });
    await mock.subscribe('ch-B', (e) => {
      if (e.kind === 'broadcast' && typeof e.payload === 'string') chB.push(e.payload);
    });

    await mock.publish('ch-A', 'msg', 'to-A');
    await mock.publish('ch-B', 'msg', 'to-B');

    expect(chA).toEqual(['to-A']);
    expect(chB).toEqual(['to-B']);

    await mock.disconnect();
  });
});
