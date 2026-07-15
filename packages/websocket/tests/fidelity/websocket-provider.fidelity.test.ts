/**
 * fidelity test — createWSServer + connectClient が想定 reference impl と同じ挙動を示すことを検証。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createWSServer, connectClient, broadcastMessage, encodeBinaryFrame, captureBinaryFrame } from '../../src/index.js';

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

describe('websocket fidelity vs reference impl', () => {
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

  it('broadcast で 全 client の received が同数増える (mock vs reference)', () => {
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

  it('binary frame round-trip (encode → capture で payload 一致)', () => {
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
});
