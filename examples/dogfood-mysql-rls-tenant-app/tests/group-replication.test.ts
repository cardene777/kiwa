/**
 * Vitest — MySQL 8 group replication flow (v1.32-3 axis 1).
 *
 * Asserts the 4-state walk (empty → joined → primary-elected →
 * conflict-detected → member-left) records the expected observation for
 * downstream fidelity comparison. The mock semantics from `@kiwa/orm`
 * v0.10 enforce state ordering + member existence so we can pin the exact
 * final state without flaky timing.
 */

import { describe, expect, it } from 'vitest';
import { driveGroupReplicationFlow } from '../src/group-replication/index.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { driveGroupReplicationFlow as driveGroupReplicationAdapterFlow } from '../src/flows/mysql-flows.js';

describe('group replication — 4-state walk', () => {
  it('T-DMG-001 walks empty → joined → primary → conflict → member-left', () => {
    const { observation, session } = driveGroupReplicationFlow();
    expect(observation.finalState).toBe('member-left');
    expect(observation.primaryId).toBe('mysql-node-1');
    expect(observation.peakMemberCount).toBe(2);
    expect(observation.conflictCount).toBe(1);
    // 2 joins + 1 elect + 1 conflict + 1 leave → 5 history entries.
    expect(session.history).toHaveLength(5);
    const events = session.history.map((s) => s.neutralEvent);
    expect(events).toEqual([
      'cluster.member-joined',
      'cluster.member-joined',
      'cluster.primary-elected',
      'cluster.conflict-detected',
      'cluster.member-left',
    ]);
  });

  it('T-DMG-002 mock adapter records driveGroupReplication ok trace', async () => {
    const adapter = makeMockAdapter();
    const observation = await driveGroupReplicationAdapterFlow(adapter);
    expect(observation.finalState).toBe('member-left');
    const trace = adapter.traces().find((t) => t.op === 'driveGroupReplication');
    expect(trace?.ok).toBe(true);
    expect(adapter.metrics().groupReplicationSteps).toBe(5);
    await adapter.reset();
  });

  it('T-DMG-003 override group name + primary id propagates', () => {
    const { observation } = driveGroupReplicationFlow({
      groupName: 'kiwa_special_group',
      primaryMemberId: 'mysql-primary-a',
      secondaryMemberId: 'mysql-primary-b',
      leaveMemberId: 'mysql-primary-b',
    });
    expect(observation.groupName).toBe('kiwa_special_group');
    expect(observation.primaryId).toBe('mysql-primary-a');
    expect(observation.peakMemberCount).toBe(2);
  });

  it('T-DMG-004 backend-neutral events map to mysql-specific backendEvent names', () => {
    const { session } = driveGroupReplicationFlow();
    // Every step should carry a backend-shaped event name for the mysql
    // backend. The neutral `cluster.*` events map to either
    // `group_replication.*` (join / elect / leave) or `performance_schema.*`
    // (conflict detection). Both are mysql-specific.
    const backendEvents = session.history.map((s) => s.backendEvent);
    for (const be of backendEvents) {
      expect(
        be.startsWith('group_replication.') ||
          be.startsWith('performance_schema.'),
      ).toBe(true);
    }
    for (const step of session.history) {
      expect(step.provider).toBe('prisma');
      expect(step.backend).toBe('mysql');
    }
  });
});
