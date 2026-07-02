import { describe, expect, it } from 'vitest';
import { RealtimeEngine } from '../src/index.js';
import type { RealtimeAnyEvent } from '../src/index.js';

describe('RealtimeEngine — subscribe / publish', () => {
  it('T-RT-ENG-001 delivers broadcast to subscribed channel', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    const events: RealtimeAnyEvent[] = [];
    await engine.subscribe('room:1', (ev) => events.push(ev));
    await engine.publish('room:1', 'chat', { text: 'hi' });
    // 1st connection state + broadcast
    expect(events.some((e) => e.kind === 'broadcast')).toBe(true);
    const bev = events.find((e) => e.kind === 'broadcast');
    if (bev && bev.kind === 'broadcast') {
      expect(bev.event).toBe('chat');
      expect(bev.payload).toEqual({ text: 'hi' });
    }
  });

  it('T-RT-ENG-002 does not deliver events after unsubscribe', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    const events: RealtimeAnyEvent[] = [];
    const handle = await engine.subscribe('room:1', (ev) => events.push(ev));
    await handle.unsubscribe();
    await engine.publish('room:1', 'chat', { text: 'lost' });
    expect(events.some((e) => e.kind === 'broadcast')).toBe(false);
  });

  it('T-RT-ENG-003 isolates events per channel', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    const roomA: RealtimeAnyEvent[] = [];
    const roomB: RealtimeAnyEvent[] = [];
    await engine.subscribe('room:A', (ev) => roomA.push(ev));
    await engine.subscribe('room:B', (ev) => roomB.push(ev));
    await engine.publish('room:A', 'msg', { n: 1 });
    await engine.publish('room:B', 'msg', { n: 2 });
    const aBcasts = roomA.filter((e) => e.kind === 'broadcast');
    const bBcasts = roomB.filter((e) => e.kind === 'broadcast');
    expect(aBcasts).toHaveLength(1);
    expect(bBcasts).toHaveLength(1);
    if (aBcasts[0]?.kind === 'broadcast') expect(aBcasts[0].payload).toEqual({ n: 1 });
    if (bBcasts[0]?.kind === 'broadcast') expect(bBcasts[0].payload).toEqual({ n: 2 });
  });
});

describe('RealtimeEngine — presence', () => {
  it('T-RT-ENG-004 emits join + sync events on trackPresence', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    const events: RealtimeAnyEvent[] = [];
    await engine.subscribe('room:1', (ev) => events.push(ev));
    await engine.trackPresence('room:1', 'user-1', { name: 'Alice' });
    const presences = events.filter((e) => e.kind === 'presence');
    expect(presences.length).toBeGreaterThanOrEqual(2);
    const join = presences.find((e) => e.kind === 'presence' && e.type === 'join');
    const sync = presences.find((e) => e.kind === 'presence' && e.type === 'sync');
    expect(join).toBeDefined();
    expect(sync).toBeDefined();
    if (join?.kind === 'presence') {
      expect(join.members[0]?.userId).toBe('user-1');
      expect(join.members[0]?.payload).toEqual({ name: 'Alice' });
    }
  });

  it('T-RT-ENG-005 emits leave on untrackPresence', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    const events: RealtimeAnyEvent[] = [];
    await engine.subscribe('room:1', (ev) => events.push(ev));
    await engine.trackPresence('room:1', 'user-1');
    await engine.untrackPresence('room:1', 'user-1');
    const leave = events.find((e) => e.kind === 'presence' && e.type === 'leave');
    expect(leave).toBeDefined();
  });
});

describe('RealtimeEngine — postgres_changes', () => {
  it('T-RT-ENG-006 emitPostgresChange delivers CDC event to subscribers', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    const events: RealtimeAnyEvent[] = [];
    await engine.subscribe('public:messages', (ev) => events.push(ev));
    engine.emitPostgresChange('public:messages', {
      eventType: 'INSERT',
      schema: 'public',
      table: 'messages',
      oldRecord: null,
      newRecord: { id: 1, text: 'hello' },
    });
    const cdc = events.find((e) => e.kind === 'postgres_changes');
    expect(cdc).toBeDefined();
    if (cdc?.kind === 'postgres_changes') {
      expect(cdc.eventType).toBe('INSERT');
      expect(cdc.newRecord).toEqual({ id: 1, text: 'hello' });
    }
  });
});

describe('RealtimeEngine — connection lifecycle', () => {
  it('T-RT-ENG-007 disconnect + reconnect transitions through 5 states', async () => {
    const engine = new RealtimeEngine({
      artificialLatencyMs: 0,
      reconnect: { initialBackoffMs: 0, jitter: 0 },
    });
    await engine.subscribe('room:1', () => {});
    expect(engine.getConnectionState()).toBe('connected');
    await engine.disconnect();
    expect(engine.getConnectionState()).toBe('disconnected');
    await engine.reconnect();
    expect(engine.getConnectionState()).toBe('connected');
    const metrics = engine.getMetrics();
    expect(metrics.reconnectCount).toBe(1);
  });

  it('T-RT-ENG-008 publish during disconnect is queued and flushed on reconnect', async () => {
    const engine = new RealtimeEngine({
      artificialLatencyMs: 0,
      reconnect: { initialBackoffMs: 0, jitter: 0 },
    });
    const events: RealtimeAnyEvent[] = [];
    await engine.subscribe('room:1', (ev) => events.push(ev));
    await engine.disconnect();
    // publish during disconnect → queued (not delivered)
    await engine.publish('room:1', 'chat', { text: 'queued' });
    const beforeReconnect = events.filter((e) => e.kind === 'broadcast');
    expect(beforeReconnect).toHaveLength(0);
    // reconnect → flush queue
    await engine.reconnect();
    // give queued publish a chance to complete
    await new Promise((r) => setTimeout(r, 20));
    const afterReconnect = events.filter((e) => e.kind === 'broadcast');
    expect(afterReconnect).toHaveLength(1);
  });
});

describe('RealtimeEngine — scenario events', () => {
  it('T-RT-ENG-009 emits scenario broadcast after subscribe', async () => {
    const engine = new RealtimeEngine({
      artificialLatencyMs: 0,
      scenarios: {
        'room:1': [
          {
            kind: 'broadcast',
            event: 'chat',
            payload: { text: 'auto-emit' },
            delay: 5,
          },
        ],
      },
    });
    const events: RealtimeAnyEvent[] = [];
    await engine.subscribe('room:1', (ev) => events.push(ev));
    await new Promise((r) => setTimeout(r, 20));
    const bcasts = events.filter((e) => e.kind === 'broadcast');
    expect(bcasts).toHaveLength(1);
    if (bcasts[0]?.kind === 'broadcast') {
      expect(bcasts[0].payload).toEqual({ text: 'auto-emit' });
    }
  });
});

describe('RealtimeEngine — metrics + reset', () => {
  it('T-RT-ENG-010 tracks subscribeCount / publishCount', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    await engine.subscribe('a', () => {});
    await engine.subscribe('b', () => {});
    await engine.publish('a', 'x', {});
    await engine.publish('b', 'y', {});
    await engine.publish('a', 'z', {});
    const m = engine.getMetrics();
    expect(m.subscribeCount).toBe(2);
    expect(m.publishCount).toBe(3);
  });

  it('T-RT-ENG-011 reset clears state', async () => {
    const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
    await engine.subscribe('a', () => {});
    await engine.publish('a', 'x', {});
    engine.reset();
    const m = engine.getMetrics();
    expect(m.subscribeCount).toBe(0);
    expect(m.publishCount).toBe(0);
    expect(engine.getConnectionState()).toBe('disconnected');
  });
});

describe('RealtimeEngine — backpressure', () => {
  it('T-RT-ENG-012 drops events when queue exceeds backpressureLimit', async () => {
    const engine = new RealtimeEngine({
      artificialLatencyMs: 0,
      backpressureLimit: 2,
    });
    await engine.subscribe('room:1', () => {});
    await engine.disconnect();
    // queue depth 2 max
    await engine.publish('room:1', 'e1', {});
    await engine.publish('room:1', 'e2', {});
    await engine.publish('room:1', 'e3', {});
    await engine.publish('room:1', 'e4', {});
    const m = engine.getMetrics();
    expect(m.eventsDropped).toBeGreaterThanOrEqual(2);
  });
});
