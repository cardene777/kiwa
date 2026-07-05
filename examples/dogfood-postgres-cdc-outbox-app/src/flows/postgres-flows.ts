/**
 * Higher-level flows that compose the adapter ops. Both the mock-mode tests
 * and the fidelity harness drive these functions so the trace comparison
 * runs against identical call sequences.
 */

import type { OrderRow, PostgresCdcOutboxAdapter } from '../adapters/interface.js';

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
