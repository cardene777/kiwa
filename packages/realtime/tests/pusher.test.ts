import { describe, expect, it } from 'vitest';
import { createPusherMock } from '../src/index.js';
import type { PusherMember, PusherMembers } from '../src/index.js';

describe('createPusherMock — regular channel', () => {
  it('T-RT-PUS-001 bind receives triggered events', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0 });
    const received: unknown[] = [];
    const channel = client.subscribeChannel('my-channel');
    channel.bind('my-event', (data) => received.push(data));
    // small tick to allow init
    await new Promise((r) => setTimeout(r, 20));
    channel.trigger('my-event', { text: 'hello' });
    await new Promise((r) => setTimeout(r, 30));
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ text: 'hello' });
  });

  it('T-RT-PUS-002 unbind removes handlers', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0 });
    const received: unknown[] = [];
    const channel = client.subscribeChannel('my-channel');
    channel.bind('e', (d) => received.push(d));
    await new Promise((r) => setTimeout(r, 20));
    channel.unbind('e');
    channel.trigger('e', { n: 1 });
    await new Promise((r) => setTimeout(r, 30));
    expect(received).toHaveLength(0);
  });
});

describe('createPusherMock — presence channel', () => {
  it('T-RT-PUS-003 presence-* channel exposes members', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0, userId: 'me' });
    const channel = client.subscribeChannel('presence-room-1');
    let succeeded: PusherMembers | null = null;
    channel.bind('pusher:subscription_succeeded', (members) => {
      succeeded = members as PusherMembers;
    });
    await new Promise((r) => setTimeout(r, 30));
    // sanity: channel.members is defined for presence channels
    expect(channel.members).toBeDefined();
    // subscription_succeeded fired at least once
    expect(succeeded).not.toBeNull();
  });

  it('T-RT-PUS-004 member_added fires when new user joins via presence trackPresence', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0 });
    const added: PusherMember[] = [];
    const channel = client.subscribeChannel('presence-room-1');
    channel.bind('pusher:member_added', (member) => added.push(member as PusherMember));
    await new Promise((r) => setTimeout(r, 30));
    // engine 経由で presence track を発火
    await client.trackPresence('presence-room-1', 'alice', { name: 'Alice' });
    await new Promise((r) => setTimeout(r, 30));
    expect(added.length).toBeGreaterThan(0);
    expect(added[0]?.id).toBe('alice');
    expect(added[0]?.info).toEqual({ name: 'Alice' });
  });

  it('T-RT-PUS-005 member_removed fires on untrackPresence', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0 });
    const removed: PusherMember[] = [];
    const channel = client.subscribeChannel('presence-room-1');
    channel.bind('pusher:member_removed', (member) => removed.push(member as PusherMember));
    await new Promise((r) => setTimeout(r, 30));
    await client.trackPresence('presence-room-1', 'alice');
    await new Promise((r) => setTimeout(r, 30));
    await client.untrackPresence('presence-room-1', 'alice');
    await new Promise((r) => setTimeout(r, 30));
    expect(removed.length).toBeGreaterThan(0);
    expect(removed[0]?.id).toBe('alice');
  });
});

describe('createPusherMock — connection', () => {
  it('T-RT-PUS-006 disconnect clears open channels', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0 });
    client.subscribeChannel('a');
    client.subscribeChannel('b');
    await new Promise((r) => setTimeout(r, 30));
    await client.disconnect();
    expect(client.getConnectionState()).toBe('disconnected');
  });
});
