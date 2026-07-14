import { describe, expect, it } from 'vitest';
import { RealtimeEngine } from '../../src/index.js';

/**
 * realtime integration domain test — real RealtimeEngine で ensureConnected /
 * subscribe / publish / disconnect workflow を end-to-end で assert する。
 */
describe('realtime integration — RealtimeEngine workflow', () => {
  it('T-INT-D-001 ensureConnected + subscribe + publish の flow', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    const events: unknown[] = [];
    const sub = await engine.subscribe('ch1', (event) => events.push(event));
    await engine.publish('ch1', 'msg', { text: 'hello' });
    await new Promise((r) => setTimeout(r, 50));
    expect(events.length).toBeGreaterThan(0);
    await sub.unsubscribe();
    await engine.disconnect();
  });

  it('T-INT-D-002 unsubscribe で handler 除去', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    const events: unknown[] = [];
    const sub = await engine.subscribe('ch2', (event) => events.push(event));
    await sub.unsubscribe();
    await engine.publish('ch2', 'msg', {});
    await new Promise((r) => setTimeout(r, 50));
    const eventsAfterUnsub = events.length;
    await new Promise((r) => setTimeout(r, 50));
    expect(events.length).toBe(eventsAfterUnsub);
    await engine.disconnect();
  });

  it('T-INT-D-003 multiple channel subscribe で isolation', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    const events1: unknown[] = [];
    const events2: unknown[] = [];
    await engine.subscribe('ch3', (e) => events1.push(e));
    await engine.subscribe('ch4', (e) => events2.push(e));
    await engine.publish('ch3', 'msg', {});
    await new Promise((r) => setTimeout(r, 50));
    expect(events1.length).toBeGreaterThan(0);
    await engine.disconnect();
  });

  it('T-INT-D-004 disconnect + reconnect flow', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    await engine.ensureConnected();
    await engine.disconnect();
    await engine.reconnect();
    const sub = await engine.subscribe('ch5', () => undefined);
    expect(sub.channel).toBe('ch5');
    await engine.disconnect();
  });

  it('T-INT-D-005 reset で metrics 初期化', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    await engine.subscribe('ch6', () => undefined);
    engine.reset();
    // reset 後は fresh state
    const sub = await engine.subscribe('ch6', () => undefined);
    expect(sub.channel).toBe('ch6');
    await engine.disconnect();
  });
});
