/**
 * Vitest — MySQL 8 binlog advance flow (v1.32-3 axis 2).
 *
 * Asserts the 4-step binlog walk (position advance → GTID set update →
 * ROW format negotiate → GTID gap detect) records the expected
 * observation. The mock semantics enforce position monotonicity,
 * no-duplicate-GTID, and gap-only-detected on the expected GTID.
 */

import { describe, expect, it } from 'vitest';
import { driveBinlogAdvanceFlow } from '../src/binlog-advance/index.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { driveBinlogAdvanceFlow as driveBinlogAdvanceAdapterFlow } from '../src/flows/mysql-flows.js';

describe('binlog advance — position + gtid + format + gap', () => {
  it('T-DMB-001 walks position → 2 gtid → ROW → gap-detected', () => {
    const { observation, session } = driveBinlogAdvanceFlow();
    expect(observation.gapDetected).toBe(true);
    expect(observation.format).toBe('ROW');
    expect(observation.binlogFile).toBe('mysql-bin.000042');
    expect(observation.binlogPosition).toBe(4_096);
    expect(observation.gtidCount).toBe(2);
    // 1 position advance + 2 gtid updates + 1 format + 1 gap = 5 entries.
    expect(session.history).toHaveLength(5);
    const events = session.history.map((s) => s.neutralEvent);
    expect(events).toEqual([
      'binlog.position-advanced',
      'binlog.gtid-set-updated',
      'binlog.gtid-set-updated',
      'binlog.format-negotiated',
      'binlog.gap-detected',
    ]);
  });

  it('T-DMB-002 mock adapter records driveBinlogAdvance ok trace', async () => {
    const adapter = makeMockAdapter();
    const observation = await driveBinlogAdvanceAdapterFlow(adapter);
    expect(observation.gapDetected).toBe(true);
    const trace = adapter.traces().find((t) => t.op === 'driveBinlogAdvance');
    expect(trace?.ok).toBe(true);
    expect(adapter.metrics().binlogAdvanceOps).toBe(5);
    await adapter.reset();
  });

  it('T-DMB-003 override server id + position propagates', () => {
    const { observation } = driveBinlogAdvanceFlow({
      serverId: 'mysql-shard-a',
      position: 65_536,
      file: 'mysql-bin.000100',
    });
    expect(observation.serverId).toBe('mysql-shard-a');
    expect(observation.binlogPosition).toBe(65_536);
    expect(observation.binlogFile).toBe('mysql-bin.000100');
  });

  it('T-DMB-004 empty gtids throws before session creation', () => {
    expect(() => driveBinlogAdvanceFlow({ gtids: [] })).toThrowError(
      /at least 1 GTID/,
    );
  });
});
