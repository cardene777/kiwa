import type { RabbitMQTestEnv } from '@kiwa/queue';

/**
 * PoC — a small order-processing pipeline that fans out incoming orders to
 * (a) a fulfillment worker via a direct exchange (b) a "recent orders" audit
 * queue via topic exchange with wildcards (c) analytics via fanout. Mirrors
 * a typical self-host queue topology for a SaaS backend.
 */

export interface OrderEvent {
  id: string;
  region: 'us' | 'eu' | 'apac';
  priority: 'low' | 'high';
  total: number;
}

/**
 * Declare topology + publish one order. Returns a snapshot of the resulting
 * queue depths so the test can assert routing across exchange types.
 */
export async function fanoutOrderThroughPipeline(
  env: RabbitMQTestEnv,
  order: OrderEvent,
): Promise<{ fulfillmentDepth: number; auditDepth: number; analyticsDepth: number }> {
  await env.declareExchange({ name: 'orders.direct', type: 'direct' });
  await env.declareExchange({ name: 'orders.topic', type: 'topic' });
  await env.declareExchange({ name: 'orders.fanout', type: 'fanout' });
  await env.declareQueue({ name: 'fulfillment' });
  await env.declareQueue({ name: 'audit' });
  await env.declareQueue({ name: 'analytics' });
  await env.bindQueue({ exchange: 'orders.direct', queue: 'fulfillment', routingKey: order.region });
  await env.bindQueue({ exchange: 'orders.topic', queue: 'audit', routingKey: '#' });
  await env.bindQueue({ exchange: 'orders.fanout', queue: 'analytics', routingKey: '' });
  await env.publish({ exchange: 'orders.direct', routingKey: order.region, body: order });
  await env.publish({
    exchange: 'orders.topic',
    routingKey: `${order.region}.${order.priority}`,
    body: order,
  });
  await env.publish({ exchange: 'orders.fanout', routingKey: '', body: order });
  return {
    fulfillmentDepth: env.peek('fulfillment').length,
    auditDepth: env.peek('audit').length,
    analyticsDepth: env.peek('analytics').length,
  };
}

/**
 * Retry-with-backoff pattern using nack(requeue=true). The handler will fail
 * the first `failuresBeforeSuccess` deliveries, then succeed. Returns the
 * final delivery count observed.
 */
export async function runRetryConsumer(
  env: RabbitMQTestEnv,
  input: { queue: string; failuresBeforeSuccess: number },
): Promise<{ finalDeliveryCount: number }> {
  await env.declareQueue({ name: input.queue });
  let attempts = 0;
  await env.consume({
    queue: input.queue,
    handler: (msg) => {
      attempts += 1;
      if (attempts <= input.failuresBeforeSuccess) {
        msg.nack({ requeue: true });
      } else {
        msg.ack();
      }
    },
  });
  await env.sendToQueue({ queue: input.queue, body: 'retry-me' });
  const snap = await env.assertAcknowledged(input.queue);
  return { finalDeliveryCount: snap.deliveryCount };
}
