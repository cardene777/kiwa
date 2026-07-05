import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  createLogicalRepSession,
  createPublication,
  heartbeat,
  resolveConflict,
  syncSubscription,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('logical-replication axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: publication → sync → conflict → heartbeat happy path',
    (provider, backend) => {
      const session = createLogicalRepSession({ publisherId: 'pub', provider, backend });
      const pub = createPublication(session, {
        name: 'pub_all',
        tables: ['users', 'orders'],
      });
      expect(pub.state).toBe('published');
      const sync = syncSubscription(session, { subscriberId: 'sub_1' });
      expect(sync.state).toBe('synced');
      const conflict = resolveConflict(session, {
        subscriberId: 'sub_1',
        strategy: 'last-write-wins',
        winner: 'publisher',
      });
      expect(conflict.state).toBe('conflict-resolved');
      const beat = heartbeat(session, { at: 1_000 });
      expect(beat.neutralEvent).toBe('logical.heartbeat');
      expect(session.lastHeartbeatAt).toBe(1_000);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect',
    (provider, backend) => {
      const session = createLogicalRepSession({ publisherId: 'p', provider, backend });
      const step = createPublication(session, { name: 'x', tables: ['t'] });
      expect(step.backendEvent).toBe(
        backendEventName(backend, 'logical.publication-created', provider),
      );
    },
  );

  it('createPublication rejects empty tables', () => {
    const session = createLogicalRepSession({
      publisherId: 'p',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() => createPublication(session, { name: 'x', tables: [] })).toThrow(
      /at least one table/,
    );
  });

  it('syncSubscription requires publication', () => {
    const session = createLogicalRepSession({
      publisherId: 'p',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() => syncSubscription(session, { subscriberId: 'sub' })).toThrow(
      /no publication/,
    );
  });

  it('resolveConflict requires synced subscriber', () => {
    const session = createLogicalRepSession({
      publisherId: 'p',
      provider: 'drizzle',
      backend: 'postgres',
    });
    createPublication(session, { name: 'x', tables: ['t'] });
    syncSubscription(session, { subscriberId: 'sub_1' });
    expect(() =>
      resolveConflict(session, {
        subscriberId: 'unknown_sub',
        strategy: 'last-write-wins',
        winner: 'publisher',
      }),
    ).toThrow(/not synced/);
  });

  it('resolveConflict "reject" strategy forbids subscriber wins', () => {
    const session = createLogicalRepSession({
      publisherId: 'p',
      provider: 'drizzle',
      backend: 'postgres',
    });
    createPublication(session, { name: 'x', tables: ['t'] });
    syncSubscription(session, { subscriberId: 'sub_1' });
    expect(() =>
      resolveConflict(session, {
        subscriberId: 'sub_1',
        strategy: 'reject',
        winner: 'subscriber',
      }),
    ).toThrow(/forbids/);
  });

  it('resolveConflict requires synced state', () => {
    const session = createLogicalRepSession({
      publisherId: 'p',
      provider: 'drizzle',
      backend: 'postgres',
    });
    createPublication(session, { name: 'x', tables: ['t'] });
    expect(() =>
      resolveConflict(session, {
        subscriberId: 'sub',
        strategy: 'primary-wins',
        winner: 'publisher',
      }),
    ).toThrow(/synced/);
  });

  it('heartbeat rejects non-monotonic timestamp', () => {
    const session = createLogicalRepSession({
      publisherId: 'p',
      provider: 'drizzle',
      backend: 'postgres',
    });
    heartbeat(session, { at: 100 });
    expect(() => heartbeat(session, { at: 100 })).toThrow(/monotonically/);
    expect(() => heartbeat(session, { at: 50 })).toThrow(/monotonically/);
  });

  it('regression [finding 4] createPublication rejects overwrite under live topology', () => {
    // adversarial review found: createPublication silently overwrote a live
    // synced / conflict-resolved topology, orphaning subscribers from the new
    // publication.
    const session = createLogicalRepSession({
      publisherId: 'p',
      provider: 'drizzle',
      backend: 'postgres',
    });
    createPublication(session, { name: 'pub_a', tables: ['users'] });
    syncSubscription(session, { subscriberId: 'sub_1' });
    expect(session.state).toBe('synced');
    // second createPublication under live synced topology must reject
    expect(() =>
      createPublication(session, { name: 'pub_b', tables: ['orders'] }),
    ).toThrow(/live topology/);
    // original publication preserved
    expect(session.publication?.name).toBe('pub_a');
    expect(session.publication?.tables).toEqual(['users']);

    // also rejected from conflict-resolved
    resolveConflict(session, {
      subscriberId: 'sub_1',
      strategy: 'last-write-wins',
      winner: 'publisher',
    });
    expect(session.state).toBe('conflict-resolved');
    expect(() =>
      createPublication(session, { name: 'pub_c', tables: ['x'] }),
    ).toThrow(/live topology/);
  });

  it('resolveConflict "primary-wins" and "last-write-wins" both allow publisher / subscriber winner', () => {
    const session = createLogicalRepSession({
      publisherId: 'p',
      provider: 'drizzle',
      backend: 'postgres',
    });
    createPublication(session, { name: 'x', tables: ['t'] });
    syncSubscription(session, { subscriberId: 'sub_a' });
    const primaryWins = resolveConflict(session, {
      subscriberId: 'sub_a',
      strategy: 'primary-wins',
      winner: 'publisher',
    });
    expect(primaryWins.metadata.strategy).toBe('primary-wins');
    const lww = resolveConflict(session, {
      subscriberId: 'sub_a',
      strategy: 'last-write-wins',
      winner: 'subscriber',
    });
    expect(lww.metadata.winner).toBe('subscriber');
  });
});
