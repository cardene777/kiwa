import type { OrderMessage, QueueAdapter } from '../adapters/interface.js';

export async function bootstrap(adapter: QueueAdapter): Promise<void> {
  await adapter.declareTopology();
}

export async function drainOrders(
  adapter: QueueAdapter,
  orders: OrderMessage[],
): Promise<{ triageDepth: number; outboxDepth: number }> {
  let triageDepth = 0;
  let outboxDepth = 0;
  for (const order of orders) {
    const depths = await adapter.processOrder(order);
    triageDepth = depths.triage;
    outboxDepth = depths.outbox;
  }
  return { triageDepth, outboxDepth };
}

export async function reminderFlow(
  adapter: QueueAdapter,
  input: { phone: string; text: string; delayMs: number },
): Promise<{ delivered: boolean }> {
  const { delivered } = await adapter.scheduleDelayedReminder(input);
  return { delivered };
}

export async function retryFlow(
  adapter: QueueAdapter,
  failuresBeforeSuccess: number,
): Promise<number> {
  const out = await adapter.processRetryPolicy({ failuresBeforeSuccess });
  return out.finalDeliveryCount;
}

export async function quorumFlow(
  adapter: QueueAdapter,
  failNodeId: string,
): Promise<boolean> {
  const out = await adapter.verifyQuorumSurvival({ failNodeId });
  return out.survived;
}

export async function federationFlow(
  adapter: QueueAdapter,
  input: { upstreamName: string; body: unknown },
): Promise<{ landedOnQueue: string; depthAfter: number }> {
  const out = await adapter.ingestFromFederationUpstream({
    upstreamName: input.upstreamName,
    exchange: 'dlx.work',
    routingKey: 'work.failed',
    body: input.body,
  });
  return { landedOnQueue: out.landedOnQueue, depthAfter: out.depthAfter };
}

export async function reconnectFlow(
  adapter: QueueAdapter,
  failAttempts: number,
): Promise<{ succeeded: boolean; totalDelayMs: number }> {
  const out = await adapter.simulateReconnect({ failAttempts });
  return { succeeded: out.succeeded, totalDelayMs: out.totalDelayMs };
}
