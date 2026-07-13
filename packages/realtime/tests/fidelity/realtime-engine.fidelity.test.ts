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
});
