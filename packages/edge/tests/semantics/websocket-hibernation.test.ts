import { describe, expect, it } from 'vitest';
import {
  completeReconnect,
  hibernate,
  platformEventName,
  restoreState,
  resume,
  startHibernationSession,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('websocket-hibernation axis — 3 platform', () => {
  it.each(platforms)(
    '%s: live → hibernate → resume → restore → reconnect',
    (platform) => {
      const session = startHibernationSession({
        platform,
        connectionId: 'ws-1',
        initialState: { userId: 'u-1', room: 'r-1' },
      });
      expect(session.state).toBe('live');

      const h = hibernate(session, { nowMs: 1_000 });
      expect(h.state).toBe('hibernated');
      expect(h.neutralEvent).toBe('ws-hibernation.entered');
      expect(h.platformEvent).toBe(platformEventName(platform, 'ws-hibernation.entered'));
      expect(h.metadata).toMatchObject({ hibernatedAtMs: 1_000, storedKeys: 2 });

      const r = resume(session, { nowMs: 10_000 });
      expect(r.state).toBe('resuming');
      expect(r.metadata).toMatchObject({ hibernatedMs: 9_000 });

      const rs = restoreState(session, { expectedKeys: ['userId', 'room'] });
      expect(rs.metadata).toMatchObject({ restoredKeys: 2, missingKeys: 0 });

      const done = completeReconnect(session);
      expect(done.state).toBe('reconnected');
      expect(done.neutralEvent).toBe('ws-hibernation.reconnected');
    },
  );

  it('restoreState reports missing keys without throwing', () => {
    const session = startHibernationSession({
      platform: 'cloudflare',
      connectionId: 'ws-2',
      initialState: { userId: 'u' },
    });
    hibernate(session, { nowMs: 0 });
    resume(session, { nowMs: 100 });
    const step = restoreState(session, { expectedKeys: ['userId', 'room', 'lang'] });
    expect(step.metadata).toMatchObject({
      expectedKeys: 3,
      missingKeys: 2,
      restoredKeys: 1,
    });
  });

  it('rejects hibernate when not live', () => {
    const session = startHibernationSession({ platform: 'vercel', connectionId: 'ws-x' });
    hibernate(session, { nowMs: 0 });
    expect(() => hibernate(session, { nowMs: 100 })).toThrow(/hibernated/);
  });

  it('rejects resume when not hibernated', () => {
    const session = startHibernationSession({ platform: 'deno', connectionId: 'ws-y' });
    expect(() => resume(session, { nowMs: 0 })).toThrow(/live/);
  });

  it('rejects restoreState when not resuming', () => {
    const session = startHibernationSession({ platform: 'cloudflare', connectionId: 'ws-z' });
    expect(() => restoreState(session, { expectedKeys: [] })).toThrow(/live/);
  });

  it('rejects completeReconnect when not resuming', () => {
    const session = startHibernationSession({ platform: 'vercel', connectionId: 'ws-w' });
    expect(() => completeReconnect(session)).toThrow(/expected resuming/);
  });

  it('accumulates full history in order', () => {
    const session = startHibernationSession({
      platform: 'deno',
      connectionId: 'ws-h',
      initialState: { a: 1 },
    });
    hibernate(session, { nowMs: 0 });
    resume(session, { nowMs: 10 });
    restoreState(session, { expectedKeys: ['a'] });
    completeReconnect(session);
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'ws-hibernation.entered',
      'ws-hibernation.resumed',
      'ws-hibernation.state-restored',
      'ws-hibernation.reconnected',
    ]);
  });

  it('initialState carried over through hibernation cycle', () => {
    const session = startHibernationSession({
      platform: 'cloudflare',
      connectionId: 'ws-i',
      initialState: { k1: 'v1', k2: 42 },
    });
    hibernate(session, { nowMs: 0 });
    resume(session, { nowMs: 100 });
    expect(session.storedState.k1).toBe('v1');
    expect(session.storedState.k2).toBe(42);
  });
});
