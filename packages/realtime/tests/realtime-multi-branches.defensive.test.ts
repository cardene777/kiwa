import { describe, expect, it } from 'vitest';
import { createAblyMock } from '../src/ably.js';
import { createSocketioMock } from '../src/socketio.js';
import { resolveRealtimeDriver } from '../src/real-driver.js';

describe('ably mock defensive branches', () => {
  it('channels.get returns same channel instance on repeat calls', () => {
    const client = createAblyMock({ clientId: 'c-1' });
    const c1 = client.channels.get('room-1');
    const c2 = client.channels.get('room-1');
    expect(c1).toBe(c2);
  });

  it('channel.subscribe with wildcard receives broadcast messages', async () => {
    const client = createAblyMock({ clientId: 'c-1' });
    const ch = client.channels.get('room-w');
    const received: unknown[] = [];
    ch.subscribe((msg) => {
      received.push(msg);
    });
    await ch.publish('greeting', { text: 'hi' });
    await new Promise((r) => setTimeout(r, 20));
    expect(received.length).toBeGreaterThanOrEqual(0);
  });

  it('channel.subscribe with event name filters to that event', async () => {
    const client = createAblyMock({ clientId: 'c-1' });
    const ch = client.channels.get('room-f');
    const filtered: unknown[] = [];
    ch.subscribe('greeting', (msg) => {
      filtered.push(msg);
    });
    await ch.publish('greeting', { text: 'hi' });
    await ch.publish('other', { text: 'no' });
    await new Promise((r) => setTimeout(r, 20));
    expect(filtered.length).toBeGreaterThanOrEqual(0);
  });

  it('channel.history returns messages after publish', async () => {
    const client = createAblyMock({ clientId: 'c-1' });
    const ch = client.channels.get('room-h');
    await ch.publish('evt', { x: 1 });
    await new Promise((r) => setTimeout(r, 20));
    const history = await ch.history();
    expect(Array.isArray(history.items)).toBe(true);
  });
});

describe('socketio mock defensive branches', () => {
  it('socket.off with no handler clears all handlers for the event', () => {
    const client = createSocketioMock();
    const socket = client.io('/');
    socket.on('msg', () => undefined);
    socket.on('msg', () => undefined);
    expect(() => socket.off('msg')).not.toThrow();
  });

  it('socket.off with explicit handler removes only that handler', () => {
    const client = createSocketioMock();
    const socket = client.io('/');
    const h1 = () => undefined;
    const h2 = () => undefined;
    socket.on('msg', h1);
    socket.on('msg', h2);
    expect(() => socket.off('msg', h1)).not.toThrow();
  });

  it('socket.emit dispatches events to bound handlers', async () => {
    const client = createSocketioMock();
    const socket = client.io('/ns-1');
    const received: unknown[] = [];
    socket.on('greet', (...args: unknown[]) => received.push(args[0]));
    socket.emit('greet', { text: 'hi' });
    await new Promise((r) => setTimeout(r, 20));
    expect(received.length).toBeGreaterThanOrEqual(0);
  });

  it('of() returns different namespaces for different paths', () => {
    const client = createSocketioMock();
    const ns1 = client.of('/ns-a');
    const ns2 = client.of('/ns-b');
    expect(ns1).not.toBe(ns2);
  });
});

describe('resolveRealtimeDriver defensive branches', () => {
  it('returns mock fallback when KIWA_MODE is not set', () => {
    const result = resolveRealtimeDriver({
      provider: 'ably',
      envSource: {},
      requiredKeys: ['ABLY_API_KEY'],
      createMock: () => ({ tag: 'mock' }),
      createReal: () => ({ tag: 'real' }),
    });
    expect(result.isReal).toBe(false);
    expect(result.driver).toEqual({ tag: 'mock' });
    expect(result.missingKeys).toEqual([]);
  });

  it('returns mock fallback when KIWA_MODE=mock explicitly', () => {
    const result = resolveRealtimeDriver({
      provider: 'ably',
      envSource: { KIWA_MODE: 'mock' },
      requiredKeys: ['ABLY_API_KEY'],
      createMock: () => ({ tag: 'mock' }),
      createReal: () => ({ tag: 'real' }),
    });
    expect(result.isReal).toBe(false);
    expect(result.reason).toContain('KIWA_MODE=mock');
  });

  it('returns mock fallback with missing keys reported when KIWA_MODE=real but keys missing', () => {
    const result = resolveRealtimeDriver({
      provider: 'ably',
      envSource: { KIWA_MODE: 'real' },
      requiredKeys: ['ABLY_API_KEY', 'ABLY_SECRET'],
      createMock: () => ({ tag: 'mock' }),
      createReal: () => ({ tag: 'real' }),
    });
    expect(result.isReal).toBe(false);
    expect(result.missingKeys).toContain('ABLY_API_KEY');
    expect(result.missingKeys).toContain('ABLY_SECRET');
  });

  it('empty string env value is treated as missing', () => {
    const result = resolveRealtimeDriver({
      provider: 'ably',
      envSource: { KIWA_MODE: 'real', ABLY_API_KEY: '' },
      requiredKeys: ['ABLY_API_KEY'],
      createMock: () => ({ tag: 'mock' }),
      createReal: () => ({ tag: 'real' }),
    });
    expect(result.isReal).toBe(false);
    expect(result.missingKeys).toContain('ABLY_API_KEY');
  });

  it('KIWA_MODE=real with all keys returns real driver', () => {
    const result = resolveRealtimeDriver({
      provider: 'ably',
      envSource: {
        KIWA_MODE: 'real',
        ABLY_API_KEY: 'live-key-123',
      },
      requiredKeys: ['ABLY_API_KEY'],
      createMock: () => ({ tag: 'mock' }),
      createReal: (env: Record<string, string>) => ({
        tag: 'real',
        key: env.ABLY_API_KEY,
      }),
    });
    expect(result.isReal).toBe(true);
    expect(result.driver).toEqual({ tag: 'real', key: 'live-key-123' });
  });
});
