/**
 * Higher-level flows that compose the adapter ops. Both the mock-mode tests
 * and the fidelity harness drive these functions so the trace comparison
 * runs against identical call sequences.
 *
 * v1 (v1.26-2) — 5 flows: outbox / cdc pickup / replication / at-least-once
 * / fidelity emit.
 * v2 (v1.32-2) — 4 additional flows: logical-replication advanced / slot
 * advance / pgvector / testcontainers probe. Each returns a compact subset
 * of the underlying observation shape so callers can assert on the exact
 * fields that matter to their scenario without pulling in the whole
 * observation surface.
 */

import type {
  LogicalReplicationAdvancedObservation,
  OrderRow,
  PgvectorObservation,
  PostgresCdcOutboxAdapter,
  SlotAdvanceObservation,
  TestcontainersProbeObservation,
} from '../adapters/interface.js';

export async function driveOutboxFlow(
  adapter: PostgresCdcOutboxAdapter,
  orders: readonly OrderRow[],
): Promise<{ writes: number; highWaterLsn: number; sealed: boolean }> {
  const out = await adapter.driveOutbox(orders);
  return {
    writes: out.writes,
    highWaterLsn: out.highWaterLsn,
    sealed: out.sealed,
  };
}

export async function driveCdcPickupFlow(
  adapter: PostgresCdcOutboxAdapter,
  input: { orders: readonly OrderRow[]; ackBatchSize: number },
): Promise<{ decodedCount: number; delivered: number; pending: number }> {
  const out = await adapter.driveCdcPickup(input);
  return {
    decodedCount: out.decodedCount,
    delivered: out.delivered,
    pending: out.pending,
  };
}

export async function driveReplicationFlow(
  adapter: PostgresCdcOutboxAdapter,
  input: {
    writes: readonly { bytes: number }[];
    laggedReplicaId: string;
    laggedAppliedLsn: number;
    failoverReason: string;
    promoteReplicaId: string;
  },
): Promise<{ primaryLsn: number; replicaLag: number; failoverState: string }> {
  const out = await adapter.driveReplication(input);
  return {
    primaryLsn: out.primaryLsn,
    replicaLag: out.replicaLag,
    failoverState: out.failoverState,
  };
}

export async function driveAtLeastOnceFlow(
  adapter: PostgresCdcOutboxAdapter,
  input: {
    orders: readonly OrderRow[];
    duplicateOrders: readonly OrderRow[];
  },
): Promise<{ deliveredMessages: number; duplicateAttempts: number; ackedLsn: number }> {
  const out = await adapter.driveAtLeastOnce(input);
  return {
    deliveredMessages: out.deliveredMessages,
    duplicateAttempts: out.duplicateAttempts,
    ackedLsn: out.ackedLsn,
  };
}

export async function driveFidelityFlow(adapter: PostgresCdcOutboxAdapter): Promise<void> {
  await adapter.emitFidelity();
}

// -----------------------------------------------------------------------------
// v2 (v1.32-2) flows — logical replication advanced + slot advance + pgvector
// + testcontainers probe. Each drives the sibling adapter op + returns the
// full observation because the observation shapes are small enough that
// callers routinely want every field.
// -----------------------------------------------------------------------------

export async function driveLogicalReplicationAdvancedFlow(
  adapter: PostgresCdcOutboxAdapter,
): Promise<LogicalReplicationAdvancedObservation> {
  return adapter.driveLogicalReplicationAdvanced();
}

export async function driveSlotAdvanceFlow(
  adapter: PostgresCdcOutboxAdapter,
): Promise<SlotAdvanceObservation> {
  return adapter.driveSlotAdvance();
}

export async function drivePgvectorFlow(
  adapter: PostgresCdcOutboxAdapter,
): Promise<PgvectorObservation> {
  return adapter.drivePgvector();
}

export async function driveTestcontainersProbeFlow(
  adapter: PostgresCdcOutboxAdapter,
): Promise<TestcontainersProbeObservation> {
  return adapter.driveTestcontainersProbe();
}
