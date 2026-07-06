import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  blockDirtyRead,
  blockNonRepeatableRead,
  blockPhantomRead,
  createTxnIsolationSession,
  setTxnIsolationLevel,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('txn-isolation axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: set level → block three phenomena happy path',
    (provider, backend) => {
      const session = createTxnIsolationSession({ txnId: 'tx1', provider, backend });
      setTxnIsolationLevel(session, { level: 'serializable' });
      blockDirtyRead(session, { readerTxnId: 'tx2' });
      blockNonRepeatableRead(session, { rowKey: 'users:1' });
      const phantom = blockPhantomRead(session, { predicate: 'tenant_id = 1' });
      expect(phantom.neutralEvent).toBe('txn.phantom-read-blocked');
      expect(session.blockedPhenomena.size).toBe(3);
      expect(session.history.length).toBe(4);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect for level switch',
    (provider, backend) => {
      const session = createTxnIsolationSession({ txnId: 'tx1', provider, backend });
      const step = setTxnIsolationLevel(session, { level: 'read-committed' });
      expect(step.backendEvent).toBe(backendEventName(backend, 'txn.level-set', provider));
    },
  );

  it('blockDirtyRead rejects read-uncommitted', () => {
    const session = createTxnIsolationSession({ txnId: 'tx1', provider: 'drizzle', backend: 'postgres' });
    setTxnIsolationLevel(session, { level: 'read-uncommitted' });
    expect(() => blockDirtyRead(session, { readerTxnId: 'tx2' })).toThrow(/permits/);
  });

  it('blockNonRepeatableRead rejects read-committed', () => {
    const session = createTxnIsolationSession({ txnId: 'tx1', provider: 'drizzle', backend: 'postgres' });
    setTxnIsolationLevel(session, { level: 'read-committed' });
    blockDirtyRead(session, { readerTxnId: 'tx2' });
    expect(() => blockNonRepeatableRead(session, { rowKey: 'users:1' })).toThrow(/repeatable-read/);
  });

  it('blockPhantomRead requires serializable level', () => {
    const session = createTxnIsolationSession({ txnId: 'tx1', provider: 'drizzle', backend: 'postgres' });
    setTxnIsolationLevel(session, { level: 'repeatable-read' });
    blockDirtyRead(session, { readerTxnId: 'tx2' });
    blockNonRepeatableRead(session, { rowKey: 'users:1' });
    expect(() => blockPhantomRead(session, { predicate: 'id > 1' })).toThrow(/serializable/);
  });

  it('blockPhantomRead requires non-repeatable read guard first', () => {
    const session = createTxnIsolationSession({ txnId: 'tx1', provider: 'drizzle', backend: 'postgres' });
    setTxnIsolationLevel(session, { level: 'serializable' });
    blockDirtyRead(session, { readerTxnId: 'tx2' });
    expect(() => blockPhantomRead(session, { predicate: 'id > 1' })).toThrow(/non-repeatable/);
  });
});
