import { describe, expect, it } from 'vitest';
import {
  acceptWebSocket,
  closeWebSocket,
  platformEventName,
  requestWebSocketUpgrade,
  sendMessage,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('websocket-edge axis — 3 platform', () => {
  it.each(platforms)('%s: upgrade → accept → message → close happy path', (platform) => {
    const session = requestWebSocketUpgrade({ id: 'ws_1', platform });
    expect(session.state).toBe('pending');

    const accepted = acceptWebSocket(session);
    expect(accepted.state).toBe('open');

    const msg = sendMessage(session, { data: 'ping' });
    expect(msg.state).toBe('open');
    expect(session.messages).toEqual(['ping']);

    const closed = closeWebSocket(session, { code: 1000 });
    expect(closed.state).toBe('closed');
    expect(closed.metadata.totalMessages).toBe(1);
  });

  it.each(platforms)('%s: emits platform dialect for each neutral event', (platform) => {
    const session = requestWebSocketUpgrade({ id: 'ws_2', platform });
    expect(session.history[0]?.platformEvent).toBe(
      platformEventName(platform, 'websocket.upgrade-requested'),
    );
    const accepted = acceptWebSocket(session);
    expect(accepted.platformEvent).toBe(platformEventName(platform, 'websocket.accepted'));
    const msg = sendMessage(session, { data: 'x' });
    expect(msg.platformEvent).toBe(platformEventName(platform, 'websocket.message'));
    const closed = closeWebSocket(session, { code: 1001 });
    expect(closed.platformEvent).toBe(platformEventName(platform, 'websocket.closed'));
  });

  it('message metadata carries size + index', () => {
    const session = requestWebSocketUpgrade({ id: 'ws_3', platform: 'cloudflare' });
    acceptWebSocket(session);
    const first = sendMessage(session, { data: 'hello' });
    expect(first.metadata.size).toBe(5);
    expect(first.metadata.index).toBe(0);
    const second = sendMessage(session, { data: 'yo' });
    expect(second.metadata.index).toBe(1);
  });

  it('rejects sendMessage before accept', () => {
    const session = requestWebSocketUpgrade({ id: 'ws_4', platform: 'vercel' });
    expect(() => sendMessage(session, { data: 'x' })).toThrow(/pending/);
  });

  it('rejects accept when not pending + double close', () => {
    const session = requestWebSocketUpgrade({ id: 'ws_5', platform: 'deno' });
    acceptWebSocket(session);
    expect(() => acceptWebSocket(session)).toThrow(/open/);
    closeWebSocket(session, { code: 1000 });
    expect(() => closeWebSocket(session, { code: 1000 })).toThrow(/already closed/);
  });

  it('history accumulates one step per operation', () => {
    const session = requestWebSocketUpgrade({ id: 'ws_6', platform: 'cloudflare' });
    acceptWebSocket(session);
    sendMessage(session, { data: 'a' });
    closeWebSocket(session, { code: 1000 });
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'websocket.upgrade-requested',
      'websocket.accepted',
      'websocket.message',
      'websocket.closed',
    ]);
  });
});
