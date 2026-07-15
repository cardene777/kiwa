/**
 * skill test — websocket skill が主要 API 5 種を全て公開している + 4 provider で動作分岐する。
 */
import { describe, expect, it } from 'vitest';
import {
  createWSServer,
  connectClient,
  sendMessage,
  broadcastMessage,
  captureBinaryFrame,
  encodeBinaryFrame,
} from '../../src/index.js';

describe('websocket skill assertions', () => {
  it('createWSServer が 4 provider (ws/uwebsockets/socketio/colyseus) で instantiate', () => {
    for (const provider of ['ws', 'uwebsockets', 'socketio', 'colyseus'] as const) {
      const s = createWSServer({ provider });
      expect(s.provider).toBe(provider);
    }
  });

  it('connectClient が server に attach + accept される', () => {
    const server = createWSServer({ provider: 'ws' });
    const c = connectClient(server);
    expect(c.isOpen).toBe(true);
    expect(server.clients()[0]?.id).toBe(c.id);
  });

  it('sendMessage (client → server) で server 側 emit + listSent 記録', () => {
    const server = createWSServer({ provider: 'ws' });
    const c = connectClient(server);
    let seen: unknown = null;
    server.on('onMessage', (_client, payload) => {
      seen = payload;
    });
    sendMessage(c, null, 'client-msg');
    expect(seen).toBe('client-msg');
    expect(server.listSent().length).toBe(1);
  });

  it('broadcastMessage で 全 client の received に追加', () => {
    const server = createWSServer({ provider: 'ws' });
    const c1 = connectClient(server);
    const c2 = connectClient(server);
    broadcastMessage(server, 'to-all');
    expect(c1.received()).toEqual(['to-all']);
    expect(c2.received()).toEqual(['to-all']);
  });

  it('encodeBinaryFrame + captureBinaryFrame で opcode / fin / payload 復元', () => {
    const encoded = encodeBinaryFrame('text', new TextEncoder().encode('hello'));
    const parsed = captureBinaryFrame(encoded);
    expect(parsed.opcode).toBe('text');
    expect(parsed.fin).toBe(true);
    expect(new TextDecoder().decode(parsed.payload)).toBe('hello');
  });
});
