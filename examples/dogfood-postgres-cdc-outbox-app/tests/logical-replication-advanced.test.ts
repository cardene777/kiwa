/**
 * Vitest — Postgres 16 logical replication advanced flow (v1.32-2 axis 1).
 *
 * Asserts the 4-state walk (streaming → origin-tracked → two-safe-confirmed
 * → cascade-synced) records the expected observation for downstream fidelity
 * comparison. The mock semantics from `@kiwa/orm` v0.10 enforce state
 * ordering + LSN monotonicity so we can pin the exact final state without
 * flaky timing.
 */

import { describe, expect, it } from 'vitest';
import { driveLogicalReplicationFlow } from '../src/logical-replication/index.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { driveLogicalReplicationAdvancedFlow } from '../src/flows/postgres-flows.js';

describe('logical replication advanced — 4-state walk', () => {
  it('T-DPE-LR-001 walks streaming → origin → two-safe → cascade-synced', () => {
    const { observation, session } = driveLogicalReplicationFlow();
    expect(observation.finalState).toBe('cascade-synced');
    expect(observation.startLsn).toBe(10_000);
    expect(observation.originId).toBe('origin_orders_subscriber');
    expect(observation.confirmedFlushLsn).toBe(11_200);
    expect(observation.cascadedSubscribers).toBe(1);
    // 4 state transitions → 4 history entries.
    expect(session.history).toHaveLength(4);
    const events = session.history.map((s) => s.neutralEvent);
    expect(events).toEqual([
      'logical-advanced.streaming-started',
      'logical-advanced.origin-tracked',
      'logical-advanced.two-safe-confirmed',
      'logical-advanced.cascade-synced',
    ]);
  });

  it('T-DPE-LR-002 mock adapter records driveLogicalReplicationAdvanced ok trace', async () => {
    const adapter = makeMockAdapter();
    const observation = await driveLogicalReplicationAdvancedFlow(adapter);
    expect(observation.finalState).toBe('cascade-synced');
    const trace = adapter.traces().find((t) => t.op === 'driveLogicalReplicationAdvanced');
    expect(trace?.ok).toBe(true);
    expect(adapter.metrics().logicalReplicationSteps).toBe(4);
    await adapter.reset();
  });

  it('T-DPE-LR-003 override start LSN + protocol version propagates', () => {
    const { observation } = driveLogicalReplicationFlow({
      startLsn: 500_000,
      protocolVersion: 3,
      confirmedFlushLsn: 501_024,
      remoteLsn: 500_512,
    });
    expect(observation.startLsn).toBe(500_000);
    expect(observation.confirmedFlushLsn).toBe(501_024);
  });
});
