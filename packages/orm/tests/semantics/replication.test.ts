import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  createReplicationSession,
  markReplicaLagged,
  primaryWrite,
  promoteReplica,
  startFailover,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('replication axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: primary write → lag → failover → promoted happy path',
    (provider, backend) => {
      const session = createReplicationSession({
        primaryId: 'p1',
        provider,
        backend,
        replicaIds: ['r1', 'r2'],
      });
      expect(session.state).toBe('streaming');
      expect(session.replicas.size).toBe(2);

      const write = primaryWrite(session, { bytes: 100 });
      expect(write.neutralEvent).toBe('replication.primary-write');
      expect(session.primaryLsn).toBe(100);

      const lag = markReplicaLagged(session, { replicaId: 'r1', appliedLsn: 40 });
      expect(session.state).toBe('lagged');
      expect(lag.metadata.lag).toBe(60);

      const failover = startFailover(session, { reason: 'primary crash' });
      expect(failover.state).toBe('failover-in-progress');

      const promoted = promoteReplica(session, { replicaId: 'r2' });
      expect(promoted.state).toBe('promoted');
      expect(session.primaryId).toBe('r2');
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend / provider dialect for each neutral event',
    (provider, backend) => {
      const session = createReplicationSession({
        primaryId: 'p1',
        provider,
        backend,
        replicaIds: ['r1'],
      });
      const write = primaryWrite(session, { bytes: 10 });
      expect(write.backendEvent).toBe(
        backendEventName(backend, 'replication.primary-write', provider),
      );
      expect(write.provider).toBe(provider);
      expect(write.backend).toBe(backend);
    },
  );

  it('primaryWrite rejects zero / negative bytes', () => {
    const session = createReplicationSession({
      primaryId: 'p1',
      provider: 'drizzle',
      backend: 'postgres',
      replicaIds: [],
    });
    expect(() => primaryWrite(session, { bytes: 0 })).toThrow(/positive/);
    expect(() => primaryWrite(session, { bytes: -1 })).toThrow(/positive/);
  });

  it('primaryWrite rejected mid-failover', () => {
    const session = createReplicationSession({
      primaryId: 'p1',
      provider: 'drizzle',
      backend: 'postgres',
      replicaIds: ['r1'],
    });
    primaryWrite(session, { bytes: 10 });
    startFailover(session, { reason: 'crash' });
    expect(() => primaryWrite(session, { bytes: 5 })).toThrow(/failover/);
  });

  it('markReplicaLagged rejects unknown replica id', () => {
    const session = createReplicationSession({
      primaryId: 'p1',
      provider: 'drizzle',
      backend: 'postgres',
      replicaIds: ['r1'],
    });
    expect(() => markReplicaLagged(session, { replicaId: 'missing', appliedLsn: 0 })).toThrow(
      /unknown replica/,
    );
  });

  it('markReplicaLagged rejects appliedLsn > primaryLsn', () => {
    const session = createReplicationSession({
      primaryId: 'p1',
      provider: 'drizzle',
      backend: 'postgres',
      replicaIds: ['r1'],
    });
    primaryWrite(session, { bytes: 100 });
    expect(() =>
      markReplicaLagged(session, { replicaId: 'r1', appliedLsn: 200 }),
    ).toThrow(/exceeds/);
  });

  it('startFailover rejects re-entry from failover / promoted state', () => {
    const session = createReplicationSession({
      primaryId: 'p1',
      provider: 'drizzle',
      backend: 'postgres',
      replicaIds: ['r1'],
    });
    startFailover(session, { reason: 'crash' });
    expect(() => startFailover(session, { reason: 'crash again' })).toThrow(/cannot restart/);
  });

  it('promoteReplica requires failover-in-progress state', () => {
    const session = createReplicationSession({
      primaryId: 'p1',
      provider: 'drizzle',
      backend: 'postgres',
      replicaIds: ['r1'],
    });
    expect(() => promoteReplica(session, { replicaId: 'r1' })).toThrow(/failover-in-progress/);
  });

  it('promoteReplica rejects unknown replica id', () => {
    const session = createReplicationSession({
      primaryId: 'p1',
      provider: 'drizzle',
      backend: 'postgres',
      replicaIds: ['r1'],
    });
    startFailover(session, { reason: 'crash' });
    expect(() => promoteReplica(session, { replicaId: 'r99' })).toThrow(/unknown replica/);
  });

  it('regression [finding 1] primaryWrite rejected in terminal promoted state', () => {
    // adversarial review found: primaryWrite silently regressed terminal
    // `promoted` state back to `streaming`, corrupting the failover invariant.
    const session = createReplicationSession({
      primaryId: 'p1',
      provider: 'drizzle',
      backend: 'postgres',
      replicaIds: ['r1'],
    });
    primaryWrite(session, { bytes: 10 });
    startFailover(session, { reason: 'crash' });
    promoteReplica(session, { replicaId: 'r1' });
    expect(session.state).toBe('promoted');
    expect(() => primaryWrite(session, { bytes: 5 })).toThrow(/promoted/);
    // state stays terminal, primary lsn unchanged from promotion
    expect(session.state).toBe('promoted');
  });

  it('history accumulates one step per operation', () => {
    const session = createReplicationSession({
      primaryId: 'p1',
      provider: 'drizzle',
      backend: 'postgres',
      replicaIds: ['r1'],
    });
    primaryWrite(session, { bytes: 10 });
    markReplicaLagged(session, { replicaId: 'r1', appliedLsn: 5 });
    startFailover(session, { reason: 'crash' });
    promoteReplica(session, { replicaId: 'r1' });
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'replication.primary-write',
      'replication.replica-lagged',
      'replication.failover-started',
      'replication.promoted',
    ]);
  });
});
