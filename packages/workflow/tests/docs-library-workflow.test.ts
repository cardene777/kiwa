import { describe, expect, it } from 'vitest';
import {
  createWorkflowClient,
  defineWorkflow,
  emitEvent,
  eventDrivenTrigger,
  retryStep,
} from '../src/index.js';

describe('library documentation workflow recipes', () => {
  it('passes one step output to the next and returns a failed missing workflow', async () => {
    const client = createWorkflowClient({ provider: 'temporal', idSeed: 0 });
    client.register(defineWorkflow('order-flow', [
      { name: 'validate', run: ({ input }) => ({ orderId: input.orderId, approved: true }) },
      { name: 'ship', run: ({ previous }) => ({ shipmentId: `ship-${previous.orderId}` }) },
    ]));

    const result = await client.execute('order-flow', { orderId: 'o-1' });

    expect(result).toMatchObject({
      id: 'wf-1',
      provider: 'temporal',
      workflow: 'order-flow',
      status: 'completed',
      output: { shipmentId: 'ship-o-1' },
    });
    expect(client.listExecutions()[0]?.stepOutputs).toEqual([
      { orderId: 'o-1', approved: true },
      { shipmentId: 'ship-o-1' },
    ]);

    const missing = await client.execute('missing-flow', {});
    expect(missing).toMatchObject({ status: 'failed', error: 'workflow not registered: missing-flow' });
  });

  it('records a failed workflow without partial step outputs', async () => {
    const client = createWorkflowClient();
    client.register(defineWorkflow('charge-order', [
      { name: 'validate', run: () => ({ approved: true }) },
      { name: 'charge', run: () => { throw new Error('card declined'); } },
      { name: 'ship', run: () => ({ shipped: true }) },
    ]));

    const result = await client.execute('charge-order', { orderId: 'o-1' });

    expect(result).toMatchObject({ status: 'failed', error: 'card declined' });
    expect(client.listExecutions()[0]?.stepOutputs).toEqual([]);
  });

  it('retries an operation without sleeping in the test', async () => {
    let calls = 0;
    const result = await retryStep(async () => {
      calls += 1;
      if (calls < 3) throw new Error('temporary outage');
      return 'charged';
    }, {
      maxAttempts: 3,
      baseDelayMs: 100,
      sleep: async () => undefined,
    });

    expect(result).toEqual({ value: 'charged', attempts: 3, succeeded: true, delaysMs: [100, 200] });
  });

  it('starts an event workflow and stops after disposal', async () => {
    const client = createWorkflowClient({ provider: 'inngest' });
    const workflow = defineWorkflow('welcome-user', [
      { name: 'send-email', run: ({ input }) => ({ recipient: input.userId }) },
    ]);
    const trigger = eventDrivenTrigger(client, 'user.created', workflow);

    const first = await emitEvent(client, { name: 'user.created', payload: { userId: 'u-1' }, emittedAt: 0 });
    trigger.dispose();
    const second = await emitEvent(client, { name: 'user.created', payload: { userId: 'u-2' }, emittedAt: 1 });

    expect(first).toEqual([expect.objectContaining({ id: 'ing-1', status: 'completed' })]);
    expect(trigger.handledCount()).toBe(1);
    expect(second).toEqual([]);
  });
});
