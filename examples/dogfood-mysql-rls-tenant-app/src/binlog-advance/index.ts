/**
 * Binlog advance flow driver — wraps orm v0.10 `createBinlogSession` +
 * 4 state-transition primitives (`advanceBinlogPosition`,
 * `updateGtidSet`, `negotiateBinlogFormat`, `detectGtidGap`) into a single
 * dogfood run that walks the MySQL 8 binary log lifecycle.
 *
 * v1.32-3 scope: 1 server × 1 binlog file × 2 GTID set entries × ROW
 * format × 1 detected gap. The mock semantics enforce position
 * monotonicity + state ordering + no-duplicate-GTID + gap-only-detected
 * on the expected GTID; the real driver defers to a MySQL 8 binlog +
 * GTID client wired via `MYSQL_KEY` (v1.32-6 scope).
 */

import {
  advanceBinlogPosition,
  createBinlogSession,
  detectGtidGap,
  negotiateBinlogFormat,
  updateGtidSet,
  type BinlogSession,
} from '@kiwa/orm';
import type { BinlogAdvanceObservation } from '../adapters/interface.js';

export interface DriveBinlogAdvanceInput {
  readonly serverId?: string;
  readonly file?: string;
  readonly position?: number;
  readonly gtids?: readonly string[];
  readonly format?: 'ROW' | 'STATEMENT' | 'MIXED';
  readonly expectedMissingGtid?: string;
}

const DEFAULTS = {
  serverId: 'mysql-node-1',
  file: 'mysql-bin.000042',
  position: 4_096,
  gtids: [
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:2',
  ] as const,
  format: 'ROW' as const,
  expectedMissingGtid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:3',
};

export interface DriveBinlogAdvanceResult {
  observation: BinlogAdvanceObservation;
  session: BinlogSession;
}

/**
 * Walk position advance → GTID set update → ROW format negotiate → GTID
 * gap detect. Enforces (1) position advance is monotonic within the file,
 * (2) no duplicate GTID enters the set, (3) format negotiation happens
 * before gap detection, and (4) the detected gap is not already present
 * in the observed set.
 */
export function driveBinlogAdvanceFlow(
  input: DriveBinlogAdvanceInput = {},
): DriveBinlogAdvanceResult {
  const cfg = { ...DEFAULTS, ...input };

  if (cfg.gtids.length === 0) {
    throw new Error('driveBinlogAdvanceFlow: at least 1 GTID is required');
  }

  const session = createBinlogSession({
    serverId: cfg.serverId,
    provider: 'prisma',
    backend: 'mysql',
  });

  advanceBinlogPosition(session, { file: cfg.file, position: cfg.position });

  for (const gtid of cfg.gtids) {
    updateGtidSet(session, { gtid });
  }

  negotiateBinlogFormat(session, { format: cfg.format });

  detectGtidGap(session, { expectedGtid: cfg.expectedMissingGtid });

  const observation: BinlogAdvanceObservation = {
    serverId: session.serverId,
    binlogFile: session.file,
    binlogPosition: session.position,
    format: session.format ?? cfg.format,
    gtidCount: session.gtidSet.size,
    gapDetected: session.state === 'gap-detected',
  };

  return { observation, session };
}
