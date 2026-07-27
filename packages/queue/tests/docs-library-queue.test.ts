import { describe, expect, it } from 'vitest';
import {
  setupBullMQEnv,
  setupInngestEnv,
  setupSQSEnv,
} from '../src/index.js';

describe('library documentation queue recipes', () => {
  it('retries a BullMQ job and records its terminal failure', async () => {
    const env = await setupBullMQEnv();

    try {
      env.process(async () => { throw new Error('mail provider unavailable'); });
      await env.addJob('send-receipt', { orderId: 'o-1' }, { attempts: 2 });
      const job = await env.assertFailed('send-receipt', { retry: 2, reasonMatch: /mail provider unavailable/ });

      expect(job.attemptsMade).toBe(2);
      await env.assertQueueDrained();
    } finally {
      await env.stop();
    }
  });

  it('runs an Inngest function and its named step from an event', async () => {
    const env = await setupInngestEnv();

    try {
      env.registerFunction({
        id: 'signup-completed',
        event: 'user/signup.completed',
        retries: 3,
        handler: async ({ event, step }) => {
          const data = event.data as { userId: string };
          await step.run('send-welcome', () => ({ deliveredTo: data.userId }));
          return { accepted: true };
        },
      });
      await env.sendEvent('user/signup.completed', { userId: 'u-1' });

      await env.assertFunctionRan('signup-completed', { returnValue: { accepted: true } });
      await env.assertStepRan('signup-completed', 'send-welcome');
    } finally {
      await env.stop();
    }
  });

  it('moves an unacknowledged SQS message to its DLQ after the receive count', async () => {
    const sqs = await setupSQSEnv({
      queues: [
        { name: 'orders', visibilityTimeoutSeconds: 0.05, redrivePolicy: { deadLetterTargetArn: 'orders-dlq', maxReceiveCount: 2 } },
        { name: 'orders-dlq' },
      ],
    });

    try {
      await sqs.send('orders', { orderId: 'o-1' });
      await sqs.receive('orders');
      await new Promise((resolve) => setTimeout(resolve, 100));
      await sqs.receive('orders');
      await new Promise((resolve) => setTimeout(resolve, 100));
      await sqs.receive('orders');

      expect(await sqs.assertDeadLettered('orders', { dlq: 'orders-dlq', receiveCount: 3 })).toMatchObject({ state: 'dead' });
    } finally {
      await sqs.stop();
    }
  });
});
