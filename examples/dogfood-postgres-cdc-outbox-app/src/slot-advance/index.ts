/**
 * Replication slot advance flow driver — models a Postgres 16 logical
 * replication slot lifecycle: `pg_create_logical_replication_slot` →
 * `pg_replication_slot_advance` → `pg_drop_replication_slot`. The mock
 * uses a deterministic in-memory LSN counter so callers can assert on the
 * retained → advanced delta + slot dropped state.
 *
 * v1.32-2 scope: single slot walk, no concurrent advancers, no logical
 * decoding of intermediate WAL records. The real driver (v1.32-6) will
 * connect to a running Postgres 16 via `POSTGRES_BOOTSTRAP`.
 */

import type { SlotAdvanceObservation } from '../adapters/interface.js';

export interface DriveSlotAdvanceInput {
  readonly slotName?: string;
  readonly retainedLsn?: number;
  readonly advancedLsn?: number;
}

const DEFAULTS = {
  slotName: 'outbox_slot_v2',
  retainedLsn: 20_000,
  advancedLsn: 24_096, // 4 KiB advance to reclaim WAL
};

export interface SlotState {
  readonly name: string;
  readonly retainedLsn: number;
  readonly confirmedFlushLsn: number;
  readonly dropped: boolean;
}

/**
 * Walk create → advance → drop. Enforces (1) advance must strictly exceed
 * retained LSN and (2) the slot can only be dropped after an advance so
 * consumers cannot silently leak WAL retention.
 */
export function driveSlotAdvanceFlow(
  input: DriveSlotAdvanceInput = {},
): { state: SlotState; observation: SlotAdvanceObservation } {
  const cfg = { ...DEFAULTS, ...input };

  if (cfg.advancedLsn <= cfg.retainedLsn) {
    throw new Error(
      `driveSlotAdvanceFlow: advancedLsn (${cfg.advancedLsn}) must exceed retainedLsn (${cfg.retainedLsn})`,
    );
  }

  const created: SlotState = {
    name: cfg.slotName,
    retainedLsn: cfg.retainedLsn,
    confirmedFlushLsn: cfg.retainedLsn,
    dropped: false,
  };

  const advanced: SlotState = {
    ...created,
    confirmedFlushLsn: cfg.advancedLsn,
  };

  const dropped: SlotState = {
    ...advanced,
    dropped: true,
  };

  const observation: SlotAdvanceObservation = {
    slotName: cfg.slotName,
    retainedLsn: cfg.retainedLsn,
    advancedLsn: cfg.advancedLsn,
    dropped: dropped.dropped,
    recycledBytes: cfg.advancedLsn - cfg.retainedLsn,
  };

  return { state: dropped, observation };
}
