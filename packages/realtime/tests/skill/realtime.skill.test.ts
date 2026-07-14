import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { RealtimeEngine } from '../../src/index.js';

/**
 * realtime skill domain test — realtime lib の主要 skill flow (subscribe /
 * publish / unsubscribe / disconnect) を spy 経路で assert する。
 */
describe('realtime skill — RealtimeEngine skill flow', () => {
  it('T-SKL-D-001 subscribe + publish skill flow', async () => {
    const spy = createToolSpy();
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    const sub = await engine.subscribe('sk-ch', () => undefined);
    spy.record('realtime.subscribe', JSON.stringify({ channel: 'sk-ch' }));
    await engine.publish('sk-ch', 'msg', { v: 1 });
    spy.record('realtime.publish', JSON.stringify({ event: 'msg' }));

    assertToolCallOrder(spy, ['realtime.subscribe', 'realtime.publish']);
    await sub.unsubscribe();
    await engine.disconnect();
  });

  it('T-SKL-D-002 unsubscribe skill flow', async () => {
    const spy = createToolSpy();
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    const sub = await engine.subscribe('sk-ch2', () => undefined);
    spy.record('realtime.subscribe', '{}');
    await sub.unsubscribe();
    spy.record('realtime.unsubscribe', JSON.stringify({ channel: 'sk-ch2' }));

    assertToolCallOrder(spy, ['realtime.subscribe', 'realtime.unsubscribe']);
    await engine.disconnect();
  });

  it('T-SKL-D-003 batch publish skill (times=3)', async () => {
    const spy = createToolSpy();
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    await engine.subscribe('ch', () => undefined);
    await engine.publish('ch', 'e', {});
    spy.record('realtime.publish', '{}');
    await engine.publish('ch', 'e', {});
    spy.record('realtime.publish', '{}');
    await engine.publish('ch', 'e', {});
    spy.record('realtime.publish', '{}');

    assertToolCalled(spy, 'realtime.publish', { times: 3 });
    await engine.disconnect();
  });

  it('T-SKL-D-004 reconnect skill flow', async () => {
    const spy = createToolSpy();
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    await engine.ensureConnected();
    spy.record('realtime.connect', '{}');
    await engine.disconnect();
    spy.record('realtime.disconnect', '{}');
    await engine.reconnect();
    spy.record('realtime.reconnect', '{}');

    assertToolCallOrder(spy, ['realtime.connect', 'realtime.disconnect', 'realtime.reconnect']);
    await engine.disconnect();
  });

  it('T-SKL-D-005 presence skill flow (trackPresence + untrackPresence)', async () => {
    const spy = createToolSpy();
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    await engine.subscribe('ch-p', () => undefined);
    await engine.trackPresence('ch-p', 'user1', { status: 'online' });
    spy.record('realtime.trackPresence', JSON.stringify({ userId: 'user1' }));
    await engine.untrackPresence('ch-p', 'user1');
    spy.record('realtime.untrackPresence', JSON.stringify({ userId: 'user1' }));

    assertToolCallOrder(spy, ['realtime.trackPresence', 'realtime.untrackPresence']);
    await engine.disconnect();
  });
});
