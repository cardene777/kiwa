import type { RabbitMQAdvancedTestEnv } from '@kiwa/queue';

/**
 * PoC — a production-grade RabbitMQ topology showcasing DLX + delayed
 * scheduling + quorum queues in a 3-node cluster, plus a federation link
 * ingesting from a second broker. Mirrors what a SaaS backend running RabbitMQ
 * in HA mode typically declares.
 */

/**
 * Simulate a "reject → dead-letter" pipeline. Consumers nack messages that
 * fail schema validation; the DLX routes them to a triage queue.
 */
export async function processWithDeadLetter(
  env: RabbitMQAdvancedTestEnv,
  input: { payload: { valid: boolean; body: string } },
): Promise<{ mainDepth: number; dlqDepth: number }> {
  await env.consume({
    queue: 'work.main',
    handler: (msg) => {
      const payload = msg.body as { valid: boolean; body: string };
      if (!payload.valid) {
        msg.nack({ requeue: false });
      } else {
        msg.ack();
      }
    },
  });
  await env.sendToQueue({ queue: 'work.main', body: input.payload });
  // Give the consumer a tick.
  await new Promise((r) => setTimeout(r, 20));
  return {
    mainDepth: env.peek('work.main').filter((m) => m.state === 'ready').length,
    dlqDepth: env.peek('work.triage').length,
  };
}

/**
 * Simulate an SMS reminder scheduled for later, then advance the mock clock
 * to trigger delivery.
 */
export async function scheduleSmsReminder(
  env: RabbitMQAdvancedTestEnv,
  input: { phone: string; text: string; delayMs: number },
): Promise<{ scheduledBefore: number; deliveredAfter: number }> {
  const scheduledBefore = env.delayed.listPending().length;
  await env.delayed.publishDelayed({
    exchange: 'sms.delayed',
    routingKey: 'sms.reminder',
    body: { phone: input.phone, text: input.text },
    delayMs: input.delayMs,
  });
  await env.delayed.advanceClock(input.delayMs + 10);
  return {
    scheduledBefore,
    deliveredAfter: env.peek('sms.outbox').length,
  };
}

/**
 * Verify that a quorum queue survives a single node failure — resolveQueueNode
 * picks a still-active node, and assertQuorumHealthy passes with a lowered
 * replica floor.
 */
export function verifyQuorumSurvivesNodeFailure(
  env: RabbitMQAdvancedTestEnv,
  input: { failNodeId: string; queueName: string },
): { hostBefore: string | null; hostAfter: string | null } {
  const hostBefore = env.cluster.resolveQueueNode(input.queueName);
  void env.cluster.stopNode(input.failNodeId);
  const hostAfter = env.cluster.resolveQueueNode(input.queueName);
  env.cluster.assertQuorumHealthy(input.queueName, { minReplicas: 2 });
  return { hostBefore, hostAfter };
}
