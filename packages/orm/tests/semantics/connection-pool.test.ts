import { describe, expect, it } from 'vitest';
import {
  acquire,
  backendEventName,
  createPoolSession,
  idleTimeout,
  statementTimeout,
  waitInQueue,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

const opts = (provider: OrmProvider, backend: OrmBackend) => ({
  poolId: 'pool_1',
  provider,
  backend,
  maxConnections: 2,
  idleTimeoutMs: 100,
  statementTimeoutMs: 500,
});

describe('connection-pool axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: acquire → saturate → wait-queue → idle-timeout',
    (provider, backend) => {
      const session = createPoolSession(opts(provider, backend));
      acquire(session, { clientId: 'c1', at: 0 });
      const step = acquire(session, { clientId: 'c2', at: 0 });
      expect(step.state).toBe('saturated');

      const wait = waitInQueue(session, { clientId: 'c3' });
      expect(wait.metadata.queueDepth).toBe(1);

      const timedOut = idleTimeout(session, { clientId: 'c1', at: 200 });
      expect(timedOut.metadata.idleMs).toBe(200);
      expect(session.active.has('c1')).toBe(false);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend + provider dialect',
    (provider, backend) => {
      const session = createPoolSession(opts(provider, backend));
      const step = acquire(session, { clientId: 'c1', at: 0 });
      expect(step.backendEvent).toBe(backendEventName(backend, 'pool.acquired', provider));
    },
  );

  it('createPoolSession rejects zero max connections', () => {
    expect(() =>
      createPoolSession({
        poolId: 'p',
        provider: 'drizzle',
        backend: 'postgres',
        maxConnections: 0,
        idleTimeoutMs: 1,
        statementTimeoutMs: 1,
      }),
    ).toThrow(/positive/);
  });

  it('acquire beyond capacity throws', () => {
    const session = createPoolSession(opts('drizzle', 'postgres'));
    acquire(session, { clientId: 'c1', at: 0 });
    acquire(session, { clientId: 'c2', at: 0 });
    expect(() => acquire(session, { clientId: 'c3', at: 0 })).toThrow(/saturated/);
  });

  it('waitInQueue on non-saturated pool throws', () => {
    const session = createPoolSession(opts('drizzle', 'postgres'));
    expect(() => waitInQueue(session, { clientId: 'c1' })).toThrow(/spare capacity/);
  });

  it('idleTimeout on unknown client throws', () => {
    const session = createPoolSession(opts('drizzle', 'postgres'));
    expect(() => idleTimeout(session, { clientId: 'ghost', at: 200 })).toThrow(
      /unknown client/,
    );
  });

  it('idleTimeout on not-yet-idle client throws', () => {
    const session = createPoolSession(opts('drizzle', 'postgres'));
    acquire(session, { clientId: 'c1', at: 0 });
    expect(() => idleTimeout(session, { clientId: 'c1', at: 50 })).toThrow(
      /not idle long enough/,
    );
  });

  it('statementTimeout requires active client', () => {
    const session = createPoolSession(opts('drizzle', 'postgres'));
    expect(() =>
      statementTimeout(session, { clientId: 'ghost', elapsedMs: 1_000 }),
    ).toThrow(/unknown or inactive/);
  });

  it('statementTimeout rejects when elapsed under limit', () => {
    const session = createPoolSession(opts('drizzle', 'postgres'));
    acquire(session, { clientId: 'c1', at: 0 });
    expect(() =>
      statementTimeout(session, { clientId: 'c1', elapsedMs: 100 }),
    ).toThrow(/below limit/);
  });

  it('statementTimeout marks session cancelled and records elapsedMs', () => {
    const session = createPoolSession(opts('drizzle', 'postgres'));
    acquire(session, { clientId: 'c1', at: 0 });
    const step = statementTimeout(session, { clientId: 'c1', elapsedMs: 800 });
    expect(step.state).toBe('cancelled');
    expect(step.metadata.elapsedMs).toBe(800);
    expect(step.metadata.limitMs).toBe(500);
  });

  it('regression [finding 7] acquire rejected from terminal cancelled / evicted state', () => {
    // adversarial review found: acquire had no guard for terminal `cancelled`
    // (from statementTimeout) or `evicted` (from idleTimeout) — silently
    // reviving a terminal pool session masked the prior fault.
    const cancelledSession = createPoolSession(opts('drizzle', 'postgres'));
    acquire(cancelledSession, { clientId: 'c1', at: 0 });
    statementTimeout(cancelledSession, { clientId: 'c1', elapsedMs: 800 });
    expect(cancelledSession.state).toBe('cancelled');
    expect(() =>
      acquire(cancelledSession, { clientId: 'c2', at: 100 }),
    ).toThrow(/cancelled/);
    // terminal state preserved
    expect(cancelledSession.state).toBe('cancelled');

    const evictedSession = createPoolSession(opts('drizzle', 'postgres'));
    acquire(evictedSession, { clientId: 'c1', at: 0 });
    idleTimeout(evictedSession, { clientId: 'c1', at: 200 });
    expect(evictedSession.state).toBe('evicted');
    expect(() =>
      acquire(evictedSession, { clientId: 'c2', at: 300 }),
    ).toThrow(/evicted/);
    expect(evictedSession.state).toBe('evicted');
  });

  it('idleTimeout returns pool to "in-use" when other clients remain', () => {
    const session = createPoolSession(opts('drizzle', 'postgres'));
    acquire(session, { clientId: 'c1', at: 0 });
    acquire(session, { clientId: 'c2', at: 0 });
    const step = idleTimeout(session, { clientId: 'c1', at: 200 });
    expect(step.state).toBe('in-use');
    expect(session.active.has('c2')).toBe(true);
  });
});
