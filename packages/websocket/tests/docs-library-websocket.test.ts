import { describe, expect, it } from 'vitest';
import {
  broadcastMessage,
  connectClient,
  createRoomRegistry,
  createWSServer,
  sendMessage,
} from '../src/index.js';

describe('library documentation websocket recipes', () => {
  it('broadcasts to connected clients and sends client messages to the server only', () => {
    const server = createWSServer({ provider: 'socketio', now: () => 42 });
    const alice = connectClient(server, { id: 'alice' });
    const bob = connectClient(server, { id: 'bob' });
    const incoming: unknown[] = [];
    server.on('onMessage', (_client, payload) => incoming.push(payload));

    broadcastMessage(server, { type: 'message', data: { text: 'hello' } });
    alice.send('from alice');

    expect(alice.received()).toEqual([{ type: 'message', data: { text: 'hello' } }]);
    expect(bob.received()).toEqual([{ type: 'message', data: { text: 'hello' } }]);
    expect(server.listSent()).toEqual([
      expect.objectContaining({ target: 'broadcast', sentAt: 42 }),
      expect.objectContaining({ target: 'client', clientId: 'alice', payload: 'from alice' }),
    ]);
    expect(incoming).toEqual(['from alice']);
  });

  it('routes private and room messages without turning either into a broadcast record', () => {
    const server = createWSServer();
    const alice = connectClient(server, { id: 'alice' });
    const bob = connectClient(server, { id: 'bob' });
    const rooms = createRoomRegistry(() => 100);

    sendMessage(server, 'bob', { type: 'private', data: 'secret' });
    rooms.join('team-a', alice);
    rooms.join('team-a', bob);
    rooms.broadcastToRoom('team-a', 'update');
    rooms.leave('team-a', 'bob');
    rooms.broadcastToRoom('team-a', 'follow-up');

    expect(alice.received()).toEqual(['update', 'follow-up']);
    expect(bob.received()).toEqual([{ type: 'private', data: 'secret' }, 'update']);
    expect(server.listSent()).toEqual([]);
  });

  it('disconnects a client from the server and prevents later client sends', () => {
    const server = createWSServer();
    const alice = connectClient(server, { id: 'alice' });
    const closed: Array<[number, string]> = [];
    alice.onClose((code, reason) => closed.push([code, reason]));

    server.disconnect('alice');

    expect(alice.isOpen).toBe(false);
    expect(server.clients().map((client) => client.id)).not.toContain('alice');
    expect(closed).toEqual([[1006, 'server disconnected']]);
    expect(() => alice.send('late')).toThrow(/closed/);
  });
});
