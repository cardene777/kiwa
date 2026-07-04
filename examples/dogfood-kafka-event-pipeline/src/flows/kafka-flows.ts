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
