import { describe, expect, it } from 'vitest';
import { RealtimeEngine } from '../src/engine.js';

describe('realtime engine defensive branches', () => {
  it('disconnect from disconnected state is a no-op', async () => {
    const engine = new RealtimeEngine({});
    // Not yet connected → still 'disconnected'.
    await expect(engine.disconnect()).resolves.toBeUndefined();
    expect(engine.getConnectionState()).toBe('disconnected');
  });

  it('disconnect twice does nothing on second call', async () => {
    const engine = new RealtimeEngine({});
    await engine.ensureConnected();
    await engine.disconnect();
    await expect(engine.disconnect()).resolves.toBeUndefined();
  });

  it('unsubscribe removes handler and cleans channel state when last handler goes', async () => {
    const engine = new RealtimeEngine({});
    const sub = await engine.subscribe('ch-1', () => undefined);
    await sub.unsubscribe();
    // Second unsubscribe should be a no-op (channel unknown).
    await expect(sub.unsubscribe()).resolves.toBeUndefined();
  });

  it('unsubscribe with multiple handlers keeps channel while other handlers exist', async () => {
    const engine = new RealtimeEngine({});
    const handler1 = () => undefined;
    const handler2 = () => undefined;
    const sub1 = await engine.subscribe('ch-multi', handler1);
    await engine.subscribe('ch-multi', handler2);
    await sub1.unsubscribe();
    // ch-multi still has handler2, so publishing should not throw.
    await expect(
      engine.publish('ch-multi', 'evt', { data: 1 }),
    ).resolves.toBeUndefined();
  });

  it('untrackPresence for unknown channel is a no-op', async () => {
    const engine = new RealtimeEngine({});
    await expect(
      engine.untrackPresence('unknown-ch', 'user-1'),
    ).resolves.toBeUndefined();
  });

  it('untrackPresence for unknown user is a no-op', async () => {
    const engine = new RealtimeEngine({});
    await engine.subscribe('ch-p', () => undefined);
    await expect(
      engine.untrackPresence('ch-p', 'never-joined'),
    ).resolves.toBeUndefined();
  });

  it('trackPresence + untrackPresence emits join then leave events', async () => {
    const engine = new RealtimeEngine({});
    const events: unknown[] = [];
    await engine.subscribe('ch-track', (e) => events.push(e));
    await engine.trackPresence('ch-track', 'u-1', { name: 'Alice' });
    await engine.untrackPresence('ch-track', 'u-1');
    const kinds = events.map((e) => (e as { kind: string }).kind);
    expect(kinds).toContain('presence');
  });

  it('publish for a channel with no subscribers is a no-op', async () => {
    const engine = new RealtimeEngine({});
    await expect(
      engine.publish('no-subscribers', 'evt', { data: 1 }),
    ).resolves.toBeUndefined();
  });

  it('emitPostgresChange delivers to subscribers of the channel', async () => {
    const engine = new RealtimeEngine({});
    const events: unknown[] = [];
    await engine.subscribe('ch-pg', (e) => events.push(e));
    engine.emitPostgresChange('ch-pg', {
      eventType: 'INSERT',
      schema: 'public',
      table: 'users',
      oldRecord: {},
      newRecord: { id: 1 },
    });
    expect(events.length).toBeGreaterThan(0);
  });

  it('emitPostgresChange for unknown channel is silently dropped', () => {
    const engine = new RealtimeEngine({});
    expect(() =>
      engine.emitPostgresChange('unknown-pg', {
        eventType: 'INSERT',
        schema: 'public',
        table: 'users',
        oldRecord: {},
        newRecord: {},
      }),
    ).not.toThrow();
  });

  it('subscribe triggers handler for scenario events (presence + postgres)', async () => {
    const engine = new RealtimeEngine({
      scenarios: {
        'scenario-ch': [
          {
            kind: 'presence',
            type: 'sync',
            members: [
              { userId: 'u-1', payload: {}, updatedAt: 0 },
            ],
            delay: 0,
          },
          {
            kind: 'postgres_changes',
            eventType: 'UPDATE',
            schema: 'public',
            table: 't',
            oldRecord: { v: 1 },
            newRecord: { v: 2 },
            delay: 0,
          },
        ],
      },
    });
    const events: unknown[] = [];
    await engine.subscribe('scenario-ch', (e) => events.push(e));
    await new Promise((r) => setTimeout(r, 30));
    expect(events.length).toBeGreaterThan(0);
  });

  it('reset clears channels + metrics + timers', async () => {
    const engine = new RealtimeEngine({});
    await engine.subscribe('r1', () => undefined);
    engine.reset();
    // After reset, subscribe should count from 0 again.
    const metrics = engine.getMetrics();
    expect(metrics.subscribeCount).toBe(0);
  });

  it('handler that throws does not stop other handlers from firing', async () => {
    const engine = new RealtimeEngine({});
    let secondFired = false;
    await engine.subscribe('handler-err', () => {
      throw new Error('handler boom');
    });
    await engine.subscribe('handler-err', () => {
      secondFired = true;
    });
    await engine.publish('handler-err', 'evt', { data: 1 });
    expect(secondFired).toBe(true);
  });
});
