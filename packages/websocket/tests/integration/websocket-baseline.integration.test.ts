/**
 * integration test — WebSocket end-to-end workflow (server accept → client send → server receive →
 * broadcast → binary frame roundtrip → close) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createWSServer,
  connectClient,
  sendMessage,
  broadcastMessage,
  encodeBinaryFrame,
  captureBinaryFrame,
} from '../../src/index.js';

describe('websocket integration — server + client workflow', () => {
  it('T-INT-W-001 accept → client send → server onMessage 発火', () => {
    const server = createWSServer({ provider: 'ws' });
    let payload: unknown = null;
    server.on('onMessage', (_c, p) => {
      payload = p;
    });
    const c = connectClient(server);
    sendMessage(c, null, 'hello');
    expect(payload).toBe('hello');
  });

  it('T-INT-W-002 3 client accept → broadcast → 全 client 受信', () => {
    const server = createWSServer({ provider: 'socketio' });
    const clients = [connectClient(server), connectClient(server), connectClient(server)];
    broadcastMessage(server, 'hi');
    expect(clients.every((c) => c.received().includes('hi'))).toBe(true);
  });

  it('T-INT-W-003 disconnect で onDisconnect + client isOpen=false', () => {
    const server = createWSServer({ provider: 'ws' });
    let dropped = false;
    server.on('onDisconnect', () => {
      dropped = true;
    });
    const c = connectClient(server);
    server.disconnect(c.id);
    expect(dropped).toBe(true);
    expect(c.isOpen).toBe(false);
  });

  it('T-INT-W-004 binary frame encode → server → client → parse で payload 一致', () => {
    const server = createWSServer({ provider: 'uwebsockets' });
    const c = connectClient(server);
    const encoded = encodeBinaryFrame('binary', new Uint8Array([10, 20, 30]));
    server.broadcast(encoded);
    const receivedFrame = c.received()[0] as Uint8Array;
    const parsed = captureBinaryFrame(receivedFrame);
    expect(Array.from(parsed.payload)).toEqual([10, 20, 30]);
  });

  it('T-INT-W-005 close 後 send で throw', () => {
    const server = createWSServer({ provider: 'ws' });
    const c = connectClient(server);
    c.close();
    expect(() => c.send('after-close')).toThrow(/closed/);
  });
});
