/**
 * Higher-level flows that compose the adapter ops. These are the driver
 * functions that both the mock-mode tests and the fidelity harness run.
 */

import type {
  NatsJetStreamAdapter,
  OrderEvent,
  UserProfile,
} from '../adapters/interface.js';

export async function driveJetStreamFlow(
  adapter: NatsJetStreamAdapter,
  events: readonly OrderEvent[],
): Promise<{ published: number; acked: number; redelivered: number }> {
  const out = await adapter.driveJetStream(events);
  return {
    published: out.publishedSeqs.length,
    acked: out.ackedCount,
    redelivered: out.redeliveredCount,
  };
}

export async function driveKVFlow(
  adapter: NatsJetStreamAdapter,
  profiles: readonly UserProfile[],
): Promise<{ puts: number; updates: number; deletes: number; lastRevision: number }> {
  const out = await adapter.driveKV(profiles);
  return {
    puts: out.puts,
    updates: out.updates,
    deletes: out.deletes,
    lastRevision: out.lastRevision,
  };
}

export async function driveObjectFlow(
  adapter: NatsJetStreamAdapter,
): Promise<{ objectsPut: number; totalBytesStored: number; uniqueDigests: number }> {
  const out = await adapter.driveObject();
  return {
    objectsPut: out.objectsPut,
    totalBytesStored: out.totalBytesStored,
    uniqueDigests: new Set(out.digests).size,
  };
}

export async function driveRoutingFlow(
  adapter: NatsJetStreamAdapter,
): Promise<{
  literal: number;
  wildcard: number;
  catchAll: number;
  queue: number;
  queueSize: number;
}> {
  const out = await adapter.driveRouting();
  return {
    literal: out.literalDeliveries,
    wildcard: out.wildcardDeliveries,
    catchAll: out.catchAllDeliveries,
    queue: out.queueGroupDeliveries,
    queueSize: out.queueGroupSize,
  };
}

export async function driveFidelityFlow(adapter: NatsJetStreamAdapter): Promise<void> {
  await adapter.emitFidelity();
}
