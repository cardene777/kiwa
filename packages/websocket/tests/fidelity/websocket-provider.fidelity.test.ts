/**
 * fidelity test v2.1 — 10 case = connect / broadcast / close / binary / filter +
 * reconnect delay / heartbeat pong / heartbeat missed / room join / room broadcast。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createWSServer,
  connectClient,
  broadcastMessage,
  encodeBinaryFrame,
  captureBinaryFrame,
  computeReconnectDelay,
  createHeartbeatState,
  createRoomRegistry,
} from '../../src/index.js';

function referenceBroadcast() {
  const clients: Array<{ id: string; received: unknown[] }> = [];
  return {
    connect(id: string) {
      const c = { id, received: [] as unknown[] };
      clients.push(c);
      return c;
    },
    broadcast(payload: unknown) {
      for (const c of clients) c.received.push(payload);
    },
    count(id: string) {
      return clients.find((c) => c.id === id)?.received.length ?? 0;
    },
  };
}

describe('websocket fidelity v2.1', () => {
  it('single client accept で clients() が 1 件返す', async () => {
    const server = createWSServer({ provider: 'ws' });
    const real = referenceBroadcast();
    real.connect('r-1');
    connectClient(server);
    const result = await assertFidelity({
      mockFn: async () => server.clients().length,
      realFn: async () => 1,
      cases: [{ name: 'single connect', args: [] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('broadcast で 全 client の received が同数増える', () => {
    const server = createWSServer({ provider: 'socketio' });
    const c1 = connectClient(server);
    const c2 = connectClient(server);
    const real = referenceBroadcast();
    const r1 = real.connect('r-1');
    const r2 = real.connect('r-2');
    broadcastMessage(server, 'hi');
    real.broadcast('hi');
    expect(c1.received().length).toBe(r1.received.length);
    expect(c2.received().length).toBe(r2.received.length);
  });

  it('close で isOpen=false + onClose 発火', () => {
    const server = createWSServer({ provider: 'ws' });
    const c = connectClient(server);
    let code = 0;
    c.onClose((cd) => {
      code = cd;
    });
    c.close(1001, 'going away');
    expect(c.isOpen).toBe(false);
    expect(code).toBe(1001);
  });

  it('binary frame round-trip', () => {
    const payload = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = encodeBinaryFrame('binary', payload);
    const parsed = captureBinaryFrame(encoded);
    expect(parsed.opcode).toBe('binary');
    expect(Array.from(parsed.payload)).toEqual([1, 2, 3, 4, 5]);
  });

  it('filter 付き broadcastMessage で subset 配信', () => {
    const server = createWSServer({ provider: 'colyseus' });
    const c1 = connectClient(server, { id: 'a' });
    const c2 = connectClient(server, { id: 'b' });
    broadcastMessage(server, 'only-a', (c) => c.id === 'a');
    expect(c1.received()).toEqual(['only-a']);
    expect(c2.received()).toEqual([]);
  });

  it('reconnect exp backoff = attempt 1..3 で delay 増加', () => {
    const policy = { maxAttempts: 5, initialDelayMs: 100, maxDelayMs: 5000 };
    const a1 = computeReconnectDelay(1, policy);
    const a2 = computeReconnectDelay(2, policy);
    const a3 = computeReconnectDelay(3, policy);
    expect(a1.delayMs).toBe(100);
    expect(a2.delayMs).toBe(200);
    expect(a3.delayMs).toBe(400);
  });

  it('reconnect give up = attempt > maxAttempts で giveUp=true', () => {
    const policy = { maxAttempts: 2, initialDelayMs: 100, maxDelayMs: 5000 };
    const gaveUp = computeReconnectDelay(3, policy);
    expect(gaveUp.giveUp).toBe(true);
  });

  it('heartbeat pong = missedPongs を 0 リセット + healthy 維持', () => {
    let t = 0;
    const hb = createHeartbeatState(() => t);
    hb.ping();
    t = 50;
    hb.pong();
    expect(hb.state.missedPongs).toBe(0);
    expect(hb.state.healthy).toBe(true);
  });

  it('heartbeat missed = threshold 超過 + max miss で unhealthy', () => {
    let t = 0;
    const hb = createHeartbeatState(() => t);
    hb.ping();
    t = 5000;
    hb.check(100, 1);
    expect(hb.state.missedPongs).toBeGreaterThanOrEqual(1);
    expect(hb.state.healthy).toBe(false);
  });

  it('room join + broadcast = 該当 room member にのみ配信', () => {
    const server = createWSServer({ provider: 'colyseus' });
    const a = connectClient(server, { id: 'a' });
    const b = connectClient(server, { id: 'b' });
    const c = connectClient(server, { id: 'c' });
    const rooms = createRoomRegistry();
    rooms.join('lobby', a);
    rooms.join('lobby', b);
    rooms.join('other', c);
    const count = rooms.broadcastToRoom('lobby', 'hi');
    expect(count).toBe(2);
    expect(a.received()).toEqual(['hi']);
    expect(b.received()).toEqual(['hi']);
    expect(c.received()).toEqual([]);
  });
});
