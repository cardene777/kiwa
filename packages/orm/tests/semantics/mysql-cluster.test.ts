import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  createMysqlClusterSession,
  detectClusterConflict,
  electClusterPrimary,
  joinClusterMember,
  leaveClusterMember,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('mysql-cluster axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: join → elect → conflict → leave happy path',
    (provider, backend) => {
      const session = createMysqlClusterSession({ groupName: 'g1', provider, backend });
      joinClusterMember(session, { memberId: 'm1', weight: 10 });
      joinClusterMember(session, { memberId: 'm2', weight: 5 });
      electClusterPrimary(session, { memberId: 'm1', mode: 'single-primary' });
      detectClusterConflict(session, { transactionId: 'tx1', winnerMemberId: 'm1' });
      const left = leaveClusterMember(session, { memberId: 'm2' });
      expect(left.neutralEvent).toBe('cluster.member-left');
      expect(left.metadata.memberCount).toBe(1);
      expect(session.history.length).toBe(5);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect for member join',
    (provider, backend) => {
      const session = createMysqlClusterSession({ groupName: 'g1', provider, backend });
      const step = joinClusterMember(session, { memberId: 'm1', weight: 1 });
      expect(step.backendEvent).toBe(backendEventName(backend, 'cluster.member-joined', provider));
    },
  );

  it('joinClusterMember rejects duplicate member', () => {
    const session = createMysqlClusterSession({ groupName: 'g1', provider: 'drizzle', backend: 'mysql' });
    joinClusterMember(session, { memberId: 'm1', weight: 1 });
    expect(() => joinClusterMember(session, { memberId: 'm1', weight: 1 })).toThrow(/already/);
  });

  it('electClusterPrimary rejects multi-primary mode', () => {
    const session = createMysqlClusterSession({ groupName: 'g1', provider: 'drizzle', backend: 'mysql' });
    joinClusterMember(session, { memberId: 'm1', weight: 1 });
    expect(() => electClusterPrimary(session, { memberId: 'm1', mode: 'multi-primary' })).toThrow(
      /single-primary/,
    );
  });

  it('detectClusterConflict requires elected primary', () => {
    const session = createMysqlClusterSession({ groupName: 'g1', provider: 'drizzle', backend: 'mysql' });
    joinClusterMember(session, { memberId: 'm1', weight: 1 });
    expect(() =>
      detectClusterConflict(session, { transactionId: 'tx1', winnerMemberId: 'm1' }),
    ).toThrow(/primary-elected/);
  });

  it('leaveClusterMember clears primary when primary leaves', () => {
    const session = createMysqlClusterSession({ groupName: 'g1', provider: 'drizzle', backend: 'mysql' });
    joinClusterMember(session, { memberId: 'm1', weight: 1 });
    electClusterPrimary(session, { memberId: 'm1', mode: 'single-primary' });
    const step = leaveClusterMember(session, { memberId: 'm1' });
    expect(step.metadata.primaryPresent).toBe(false);
  });

  it('joinClusterMember rejects empty memberId', () => {
    const session = createMysqlClusterSession({ groupName: 'g1', provider: 'drizzle', backend: 'mysql' });
    expect(() => joinClusterMember(session, { memberId: '', weight: 1 })).toThrow(
      /memberId is required/,
    );
  });

  it('joinClusterMember rejects negative weight', () => {
    const session = createMysqlClusterSession({ groupName: 'g1', provider: 'drizzle', backend: 'mysql' });
    expect(() => joinClusterMember(session, { memberId: 'm1', weight: -1 })).toThrow(
      /weight must be non-negative/,
    );
  });

  it('detectClusterConflict rejects an unknown winnerMemberId even after primary election', () => {
    const session = createMysqlClusterSession({ groupName: 'g1', provider: 'drizzle', backend: 'mysql' });
    joinClusterMember(session, { memberId: 'm1', weight: 1 });
    electClusterPrimary(session, { memberId: 'm1', mode: 'single-primary' });
    expect(() =>
      detectClusterConflict(session, { transactionId: 'tx1', winnerMemberId: 'ghost' }),
    ).toThrow(/unknown winner/);
  });
});
