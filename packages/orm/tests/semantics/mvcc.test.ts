import { describe, expect, it } from 'vitest';
import {
  abortSerializable,
  backendEventName,
  blockPhantom,
  createMvccSession,
  detectDeadlock,
  takeSnapshot,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('mvcc axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: snapshot → phantom-block happy path (repeatable-read)',
    (provider, backend) => {
      const session = createMvccSession({
        txnId: 'txn_1',
        provider,
        backend,
        isolation: 'repeatable-read',
      });
      const snap = takeSnapshot(session, { snapshotId: 42 });
      expect(snap.state).toBe('snapshot-held');
      expect(session.snapshotId).toBe(42);
      const phantom = blockPhantom(session, {
        predicate: 'id > 100',
        blockingTxn: 'txn_2',
      });
      expect(phantom.state).toBe('phantom-blocked');
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect for each event',
    (provider, backend) => {
      const session = createMvccSession({
        txnId: 'txn_1',
        provider,
        backend,
        isolation: 'serializable',
      });
      const snap = takeSnapshot(session, { snapshotId: 1 });
      expect(snap.backendEvent).toBe(
        backendEventName(backend, 'mvcc.snapshot-taken', provider),
      );
    },
  );

  it('takeSnapshot rejects when txn is aborted', () => {
    const session = createMvccSession({
      txnId: 'txn_1',
      provider: 'drizzle',
      backend: 'postgres',
      isolation: 'serializable',
    });
    abortSerializable(session, { reason: 'conflict' });
    expect(() => takeSnapshot(session, { snapshotId: 1 })).toThrow(/aborted/);
  });

  it('abortSerializable requires serializable isolation', () => {
    const session = createMvccSession({
      txnId: 'txn_1',
      provider: 'drizzle',
      backend: 'postgres',
      isolation: 'repeatable-read',
    });
    expect(() => abortSerializable(session, { reason: 'x' })).toThrow(/serializable/);
  });

  it('abortSerializable rejects double abort', () => {
    const session = createMvccSession({
      txnId: 'txn_1',
      provider: 'drizzle',
      backend: 'postgres',
      isolation: 'serializable',
    });
    abortSerializable(session, { reason: 'first' });
    expect(() => abortSerializable(session, { reason: 'second' })).toThrow(/already/);
  });

  it('blockPhantom rejects read-committed isolation', () => {
    const session = createMvccSession({
      txnId: 'txn_1',
      provider: 'drizzle',
      backend: 'postgres',
      isolation: 'read-committed',
    });
    expect(() =>
      blockPhantom(session, { predicate: 'x', blockingTxn: 'y' }),
    ).toThrow(/read-committed/);
  });

  it('blockPhantom rejects aborted / deadlocked txn', () => {
    const session = createMvccSession({
      txnId: 'txn_1',
      provider: 'drizzle',
      backend: 'postgres',
      isolation: 'serializable',
    });
    abortSerializable(session, { reason: 'x' });
    expect(() =>
      blockPhantom(session, { predicate: 'p', blockingTxn: 't' }),
    ).toThrow(/aborted/);
  });

  it('detectDeadlock requires cycle of at least 2', () => {
    const session = createMvccSession({
      txnId: 'txn_1',
      provider: 'drizzle',
      backend: 'postgres',
      isolation: 'serializable',
    });
    expect(() => detectDeadlock(session, { cycle: ['txn_1'] })).toThrow(/at least 2/);
  });

  it('detectDeadlock requires session txn in cycle', () => {
    const session = createMvccSession({
      txnId: 'txn_1',
      provider: 'drizzle',
      backend: 'postgres',
      isolation: 'serializable',
    });
    expect(() =>
      detectDeadlock(session, { cycle: ['txn_2', 'txn_3'] }),
    ).toThrow(/not in cycle/);
  });

  it('detectDeadlock marks session deadlocked', () => {
    const session = createMvccSession({
      txnId: 'txn_1',
      provider: 'drizzle',
      backend: 'postgres',
      isolation: 'serializable',
    });
    const step = detectDeadlock(session, { cycle: ['txn_1', 'txn_2'] });
    expect(step.state).toBe('deadlocked');
    expect(step.metadata.cycleLength).toBe(2);
    expect(step.metadata.victim).toBe('txn_1');
  });

  it('re-taking snapshot bumps snapshotId while remaining snapshot-held', () => {
    const session = createMvccSession({
      txnId: 'txn_1',
      provider: 'drizzle',
      backend: 'postgres',
      isolation: 'serializable',
    });
    takeSnapshot(session, { snapshotId: 1 });
    const second = takeSnapshot(session, { snapshotId: 2 });
    expect(second.metadata.snapshotId).toBe(2);
    expect(session.snapshotId).toBe(2);
  });
});
