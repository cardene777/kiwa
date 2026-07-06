import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  confirmTwoSafeCommit,
  createLogicalReplicationAdvancedSession,
  startLogicalStreaming,
  syncCascadedSubscription,
  trackReplicationOrigin,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('logical-replication-advanced axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: stream → origin → two-safe → cascade happy path',
    (provider, backend) => {
      const session = createLogicalReplicationAdvancedSession({ streamId: 's1', provider, backend });
      startLogicalStreaming(session, { startLsn: 10, protocolVersion: 2 });
      trackReplicationOrigin(session, { originId: 'origin-a', remoteLsn: 12 });
      confirmTwoSafeCommit(session, { confirmedFlushLsn: 15, synchronousStandbys: 1 });
      const cascaded = syncCascadedSubscription(session, {
        upstreamId: 'sub-a',
        subscriberId: 'sub-b',
      });
      expect(cascaded.neutralEvent).toBe('logical-advanced.cascade-synced');
      expect(cascaded.metadata.cascadedCount).toBe(1);
      expect(session.history.length).toBe(4);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect for streaming start',
    (provider, backend) => {
      const session = createLogicalReplicationAdvancedSession({ streamId: 's1', provider, backend });
      const step = startLogicalStreaming(session, { startLsn: 1, protocolVersion: 1 });
      expect(step.backendEvent).toBe(
        backendEventName(backend, 'logical-advanced.streaming-started', provider),
      );
    },
  );

  it('startLogicalStreaming rejects non-positive LSN', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 's1',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() => startLogicalStreaming(session, { startLsn: 0, protocolVersion: 1 })).toThrow(/positive/);
  });

  it('trackReplicationOrigin requires streaming state', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 's1',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() => trackReplicationOrigin(session, { originId: 'o1', remoteLsn: 1 })).toThrow(/streaming/);
  });

  it('confirmTwoSafeCommit rejects LSN regression', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 's1',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 10, protocolVersion: 1 });
    trackReplicationOrigin(session, { originId: 'o1', remoteLsn: 20 });
    expect(() =>
      confirmTwoSafeCommit(session, { confirmedFlushLsn: 19, synchronousStandbys: 1 }),
    ).toThrow(/regress/);
  });

  it('syncCascadedSubscription rejects self-cascade', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 's1',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 10, protocolVersion: 1 });
    trackReplicationOrigin(session, { originId: 'o1', remoteLsn: 20 });
    confirmTwoSafeCommit(session, { confirmedFlushLsn: 20, synchronousStandbys: 1 });
    expect(() =>
      syncCascadedSubscription(session, { upstreamId: 'sub-a', subscriberId: 'sub-a' }),
    ).toThrow(/differ/);
  });
});
