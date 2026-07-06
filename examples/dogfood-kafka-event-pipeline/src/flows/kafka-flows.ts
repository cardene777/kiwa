/**
 * Higher-level flows that compose the adapter ops. These are the driver
 * functions that both the mock-mode tests and the fidelity harness run.
 */

import type { KafkaEventPipelineAdapter, OrderEvent } from '../adapters/interface.js';

export async function driveProducerFlow(
  adapter: KafkaEventPipelineAdapter,
  events: readonly OrderEvent[],
): Promise<{ recordsSent: number; duplicateRetries: number; distinctPartitions: number }> {
  const out = await adapter.driveProducer(events);
  return {
    recordsSent: out.recordsSent,
    duplicateRetries: out.duplicateRetries,
    distinctPartitions: out.partitions.length,
  };
}

export async function driveConsumerGroupFlow(
  adapter: KafkaEventPipelineAdapter,
  topic: string,
): Promise<{ totalConsumed: number; rebalances: number; consumerCount: number }> {
  const out = await adapter.driveConsumerGroup(topic);
  const total = out.consumers.reduce((acc, c) => acc + c.consumedCount, 0);
  return {
    totalConsumed: total,
    rebalances: out.rebalanceCount,
    consumerCount: out.consumers.length,
  };
}

export async function driveTransactionFlow(
  adapter: KafkaEventPipelineAdapter,
  topic: string,
  commit: readonly string[],
  abort: readonly string[],
): Promise<{ readCommittedCount: number; commitState: string }> {
  const out = await adapter.driveTransaction(topic, { commit, abort });
  return {
    readCommittedCount: out.readCommittedCount,
    commitState: out.commitState,
  };
}

export async function driveDlqFlow(
  adapter: KafkaEventPipelineAdapter,
  payloads: readonly { orderId: string; valid: boolean }[],
): Promise<{ quarantinedCount: number; replayedCount: number; dlqTopic: string }> {
  const out = await adapter.driveDlq(payloads);
  return {
    quarantinedCount: out.quarantinedCount,
    replayedCount: out.replayedCount,
    dlqTopic: out.dlqTopic,
  };
}

export async function driveFidelityFlow(adapter: KafkaEventPipelineAdapter): Promise<void> {
  await adapter.emitFidelity();
}

// -----------------------------------------------------------------------------
// v2 flows (v1.31-2) — thin wrappers over the 4 new adapter ops so the
// e2e + fidelity tests read the same way as the v1 flows.
// -----------------------------------------------------------------------------

export async function driveRawProtocolFlow(
  adapter: KafkaEventPipelineAdapter,
): Promise<{ producerId: number; fencedEpoch: number; txnStates: readonly string[] }> {
  const out = await adapter.driveRawProtocol();
  return {
    producerId: out.producerId,
    fencedEpoch: out.fencedEpoch,
    txnStates: out.txnStates,
  };
}

export async function driveIsrHighWatermarkFlow(
  adapter: KafkaEventPipelineAdapter,
  topic: string,
  partition: number,
  targetOffset: number,
): Promise<{ isrSize: number; highWatermark: number; advanced: boolean }> {
  const out = await adapter.driveIsrHighWatermark(topic, partition, targetOffset);
  return {
    isrSize: out.isrSize,
    highWatermark: out.highWatermark,
    advanced: out.advanced,
  };
}

export async function driveSchemaRegistryFlow(
  adapter: KafkaEventPipelineAdapter,
  input: { subject: string; compatibility: 'BACKWARD' | 'FORWARD' | 'FULL' },
): Promise<{ compatible: boolean; registeredSchemaId: number }> {
  const out = await adapter.driveSchemaRegistry(input);
  return {
    compatible: out.compatible,
    registeredSchemaId: out.registeredSchemaId,
  };
}

export async function driveTestcontainersProbeFlow(
  adapter: KafkaEventPipelineAdapter,
): Promise<{ bootstrap: string; schemaRegistryUrl: string; reachable: boolean }> {
  const out = await adapter.driveTestcontainersProbe();
  return {
    bootstrap: out.bootstrap,
    schemaRegistryUrl: out.schemaRegistryUrl,
    reachable: out.reachable,
  };
}
