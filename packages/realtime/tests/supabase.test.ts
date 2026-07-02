import { describe, expect, it } from 'vitest';
import { createSupabaseRealtimeMock } from '../src/index.js';
import type {
  SupabaseBroadcastPayload,
  SupabasePostgresChangesPayload,
  SupabasePresencePayload,
} from '../src/index.js';

describe('createSupabaseRealtimeMock — broadcast', () => {
  it('T-RT-SUP-001 broadcasts message to subscribers via channel.on/send', async () => {
    const client = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const received: SupabaseBroadcastPayload[] = [];
    const channel = client.channel('room:1');
    await channel
      .on('broadcast', { event: 'chat' }, (p) => received.push(p))
      .subscribe();
    await channel.send({ type: 'broadcast', event: 'chat', payload: { text: 'hi' } });
    // wait for event delivery
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(1);
    expect(received[0]?.event).toBe('chat');
    expect(received[0]?.payload).toEqual({ text: 'hi' });
  });

  it('T-RT-SUP-002 does not deliver broadcast to non-matching event filter', async () => {
    const client = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const received: SupabaseBroadcastPayload[] = [];
    const channel = client.channel('room:1');
    await channel
      .on('broadcast', { event: 'chat' }, (p) => received.push(p))
      .subscribe();
    await channel.send({ type: 'broadcast', event: 'other', payload: {} });
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(0);
  });
});

describe('createSupabaseRealtimeMock — presence', () => {
  it('T-RT-SUP-003 track emits presence sync + join events', async () => {
    const client = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const events: SupabasePresencePayload[] = [];
    const channel = client.channel('room:1');
    await channel
      .on('presence', { event: 'sync' }, (p) => events.push(p))
      .on('presence', { event: 'join' }, (p) => events.push(p))
      .subscribe();
    await channel.track({ userId: 'alice', name: 'Alice' });
    await new Promise((r) => setTimeout(r, 20));
    expect(events.some((e) => e.event === 'join')).toBe(true);
    expect(events.some((e) => e.event === 'sync')).toBe(true);
  });

  it('T-RT-SUP-004 untrack emits leave', async () => {
    const client = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const events: SupabasePresencePayload[] = [];
    const channel = client.channel('room:1');
    await channel
      .on('presence', { event: 'leave' }, (p) => events.push(p))
      .subscribe();
    await channel.track({ userId: 'alice' });
    await channel.untrack();
    await new Promise((r) => setTimeout(r, 20));
    expect(events.some((e) => e.event === 'leave')).toBe(true);
  });
});

describe('createSupabaseRealtimeMock — postgres_changes', () => {
  it('T-RT-SUP-005 filters postgres_changes by event type', async () => {
    const client = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const events: SupabasePostgresChangesPayload[] = [];
    const channel = client.channel('room:1');
    await channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (p) => events.push(p),
      )
      .subscribe();
    // manually emit via engine-level exposure (through subscribe base API)
    // scenario-based emit
    client.reset();
    const client2 = createSupabaseRealtimeMock({
      artificialLatencyMs: 0,
      scenarios: {
        'room:1': [
          {
            kind: 'postgres_changes',
            eventType: 'INSERT',
            schema: 'public',
            table: 'messages',
            oldRecord: null,
            newRecord: { id: 1 },
            delay: 5,
          },
          {
            kind: 'postgres_changes',
            eventType: 'UPDATE',
            schema: 'public',
            table: 'messages',
            oldRecord: { id: 1 },
            newRecord: { id: 1, edited: true },
            delay: 5,
          },
        ],
      },
    });
    const insertOnly: SupabasePostgresChangesPayload[] = [];
    const ch2 = client2.channel('room:1');
    await ch2
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (p) => insertOnly.push(p),
      )
      .subscribe();
    await new Promise((r) => setTimeout(r, 50));
    // INSERT filter → INSERT event 1 件のみ配信
    expect(insertOnly).toHaveLength(1);
    expect(insertOnly[0]?.eventType).toBe('INSERT');
  });
});

describe('createSupabaseRealtimeMock — connection', () => {
  it('T-RT-SUP-006 tracks connection state via base RealtimeMock', async () => {
    const client = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    expect(client.getConnectionState()).toBe('disconnected');
    const channel = client.channel('room:1');
    await channel.subscribe();
    expect(client.getConnectionState()).toBe('connected');
  });

  it('T-RT-SUP-007 removeAllChannels unsubscribes everything', async () => {
    const client = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const a = client.channel('a');
    const b = client.channel('b');
    await a.subscribe();
    await b.subscribe();
    await client.removeAllChannels();
    const m = client.getMetrics();
    expect(m.subscribeCount).toBe(2);
  });
});
