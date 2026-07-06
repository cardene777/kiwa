/**
 * Higher-level flows that compose the adapter ops. These are the driver
 * functions that both the mock-mode tests and the fidelity harness run.
 *
 * v2 (v1.31-4) adds 4 more driver functions (durable / kv-revision / object-
 * chunking / testcontainers-probe) so the fidelity harness can exercise
 * every op through a uniform driver + observation shape.
 */

import type {
  JetStreamDurableObservation,
  KvRevisionObservation,
  NatsJetStreamAdapter,
  ObjectChunkingObservation,
  OrderEvent,
  TestcontainersProbeObservation,
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

// -----------------------------------------------------------------------------
// v2 (v1.31-4) — durable consumer + KV revision + Object chunking + testcontainers
// probe.
// -----------------------------------------------------------------------------

export async function driveJetStreamDurableFlow(
  adapter: NatsJetStreamAdapter,
): Promise<JetStreamDurableObservation> {
  return adapter.driveJetStreamDurable();
}

export async function driveKvRevisionFlow(
  adapter: NatsJetStreamAdapter,
): Promise<KvRevisionObservation> {
  return adapter.driveKvRevision();
}

export async function driveObjectChunkingFlow(
  adapter: NatsJetStreamAdapter,
): Promise<ObjectChunkingObservation> {
  return adapter.driveObjectChunking();
}

export async function driveTestcontainersProbeFlow(
  adapter: NatsJetStreamAdapter,
): Promise<TestcontainersProbeObservation> {
  return adapter.driveTestcontainersProbe();
}
