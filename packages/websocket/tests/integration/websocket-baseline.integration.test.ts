/**
 * integration test v2.1 — 10 case = accept/send/broadcast/close/binary + reconnect +
 * heartbeat + room + presence + cross-room isolation。
 */
import { describe, expect, it } from 'vitest';
import {
  createWSServer,
  connectClient,
  sendMessage,
  broadcastMessage,
  encodeBinaryFrame,
  captureBinaryFrame,
  computeReconnectDelay,
  createHeartbeatState,
  createRoomRegistry,
} from '../../src/index.js';

describe('websocket integration v2.1 — server + client workflow', () => {
  it('T-INT-W-001 accept → client send → server onMessage 発火', () => {
    const server = createWSServer({ provider: 'ws' });
    let payload: unknown = null;
    server.on('onMessage', (_c, p) => { payload = p; });
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
    server.on('onDisconnect', () => { dropped = true; });
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

  it('T-INT-W-006 reconnect chain = 5 attempt で delay 累計 3100ms', () => {
    const policy = { maxAttempts: 5, initialDelayMs: 100, maxDelayMs: 5000 };
    let total = 0;
    for (let i = 1; i <= 5; i++) total += computeReconnectDelay(i, policy).delayMs;
    expect(total).toBeGreaterThan(0);
    expect(total).toBe(100 + 200 + 400 + 800 + 1600);
  });

  it('T-INT-W-007 heartbeat cycle = ping → pong → healthy 継続 → pong 停止 → unhealthy', () => {
    let t = 0;
    const hb = createHeartbeatState(() => t);
    hb.ping();
    t = 30;
    hb.pong();
    expect(hb.state.healthy).toBe(true);
    t = 100;
    hb.ping();
    t = 5000;
    hb.check(200, 1);
    expect(hb.state.healthy).toBe(false);
  });

  it('T-INT-W-008 room join → broadcast → leave → 該当 client 配信停止', () => {
    const server = createWSServer({ provider: 'colyseus' });
    const a = connectClient(server, { id: 'a' });
    const b = connectClient(server, { id: 'b' });
    const rooms = createRoomRegistry();
    rooms.join('lobby', a);
    rooms.join('lobby', b);
    rooms.broadcastToRoom('lobby', 'hi-1');
    rooms.leave('lobby', 'b');
    rooms.broadcastToRoom('lobby', 'hi-2');
    expect(a.received()).toEqual(['hi-1', 'hi-2']);
    expect(b.received()).toEqual(['hi-1']);
  });

  it('T-INT-W-009 presence tracking = joined member の list を取得', () => {
    let t = 0;
    const server = createWSServer({ provider: 'socketio' });
    const a = connectClient(server, { id: 'user-a' });
    const b = connectClient(server, { id: 'user-b' });
    const rooms = createRoomRegistry(() => t);
    t = 100;
    rooms.join('game-1', a);
    t = 200;
    rooms.join('game-1', b);
    const presence = rooms.presenceOf('game-1');
    expect(presence.length).toBe(2);
    expect(presence.find((p) => p.clientId === 'user-a')?.joinedAt).toBe(100);
  });

  it('T-INT-W-010 cross-room isolation = room A の broadcast は room B に届かない', () => {
    const server = createWSServer({ provider: 'ws' });
    const a = connectClient(server, { id: 'a' });
    const b = connectClient(server, { id: 'b' });
    const rooms = createRoomRegistry();
    rooms.join('room-a', a);
    rooms.join('room-b', b);
    rooms.broadcastToRoom('room-a', 'msg-a');
    expect(a.received()).toEqual(['msg-a']);
    expect(b.received()).toEqual([]);
  });
});
