import { describe, expect, it } from 'vitest';
import { createAblyMock } from '../src/index.js';
import type { AblyMessage, AblyPresenceMessage } from '../src/index.js';

describe('createAblyMock — channels', () => {
  it('T-RT-ABL-001 channel.subscribe(event, handler) receives publish', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0 });
    const received: AblyMessage[] = [];
    const channel = client.channels.get('room-1');
    await channel.subscribe('chat', (msg) => received.push(msg));
    await channel.publish('chat', { text: 'hello' });
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(1);
    expect(received[0]?.name).toBe('chat');
    expect(received[0]?.data).toEqual({ text: 'hello' });
  });

  it('T-RT-ABL-002 wildcard subscribe receives all events', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0 });
    const received: AblyMessage[] = [];
    const channel = client.channels.get('room-1');
    await channel.subscribe((msg) => received.push(msg));
    await channel.publish('a', { n: 1 });
    await channel.publish('b', { n: 2 });
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(2);
    expect(received.map((r) => r.name)).toEqual(['a', 'b']);
  });

  it('T-RT-ABL-003 history returns recent messages in reverse order', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0 });
    const channel = client.channels.get('room-1');
    await channel.subscribe(() => {});
    await channel.publish('e', { n: 1 });
    await channel.publish('e', { n: 2 });
    await channel.publish('e', { n: 3 });
    await new Promise((r) => setTimeout(r, 20));
    const h = await channel.history({ limit: 10 });
    expect(h.items).toHaveLength(3);
    // reverse chronological
    expect((h.items[0]?.data as { n: number }).n).toBe(3);
    expect((h.items[2]?.data as { n: number }).n).toBe(1);
  });
});

describe('createAblyMock — presence', () => {
  it('T-RT-ABL-004 presence.enter emits enter event to subscribers', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0, clientId: 'alice' });
    const events: AblyPresenceMessage[] = [];
    const channel = client.channels.get('room-1');
    await channel.presence.subscribe('enter', (msg) => events.push(msg));
    await channel.presence.enter({ name: 'Alice' });
    await new Promise((r) => setTimeout(r, 20));
    expect(events).toHaveLength(1);
    expect(events[0]?.clientId).toBe('alice');
    expect(events[0]?.action).toBe('enter');
    expect(events[0]?.data).toEqual({ name: 'Alice' });
  });

  it('T-RT-ABL-005 presence.leave emits leave', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0, clientId: 'alice' });
    const events: AblyPresenceMessage[] = [];
    const channel = client.channels.get('room-1');
    await channel.presence.subscribe('leave', (msg) => events.push(msg));
    await channel.presence.enter({});
    await channel.presence.leave();
    await new Promise((r) => setTimeout(r, 20));
    expect(events.some((e) => e.action === 'leave')).toBe(true);
  });
});

describe('createAblyMock — connection', () => {
  it('T-RT-ABL-006 connection.close disconnects', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0 });
    let closed = false;
    client.connection.on('closed', () => {
      closed = true;
    });
    await client.channels.get('room-1').attach();
    await client.connection.close();
    expect(closed).toBe(true);
    expect(client.connection.state).toBe('closed');
  });
});
