/**
 * integration test — workflow domain の end-to-end workflow (register → execute → step chain →
 * event trigger → retry) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createWorkflowClient,
  defineWorkflow,
  retryStep,
  eventDrivenTrigger,
  emitEvent,
} from '../../src/index.js';

describe('workflow integration — orchestration end-to-end', () => {
  it('T-INT-W-001 register → execute → completed status + output propagation', async () => {
    const client = createWorkflowClient({ provider: 'temporal' });
    const wf = defineWorkflow('order', [
      { name: 'validate', run: (ctx) => ({ id: ctx.input.id, ok: true }) },
      { name: 'charge', run: (ctx) => ({ ...ctx.previous, chargeId: 'ch-1' }) },
    ]);
    client.register(wf);
    const res = await client.execute('order', { id: 'o-1' });
    expect(res.status).toBe('completed');
    expect(res.output?.chargeId).toBe('ch-1');
    expect(res.output?.id).toBe('o-1');
  });

  it('T-INT-W-002 step throw で failed status + error message 保存', async () => {
    const client = createWorkflowClient({ provider: 'trigger' });
    client.register(defineWorkflow('fail', [
      { name: 'boom', run: () => { throw new Error('boom!'); } },
    ]));
    const res = await client.execute('fail', {});
    expect(res.status).toBe('failed');
    expect(res.error).toBe('boom!');
  });

  it('T-INT-W-003 event 経由で 2 workflow が並列 trigger される', async () => {
    const client = createWorkflowClient({ provider: 'inngest' });
    const wfA = defineWorkflow('sendMail', [{ name: 's', run: () => ({ mailed: true }) }]);
    const wfB = defineWorkflow('logAudit', [{ name: 's', run: () => ({ logged: true }) }]);
    eventDrivenTrigger(client, 'user.created', wfA);
    eventDrivenTrigger(client, 'user.created', wfB);
    const results = await emitEvent(client, { name: 'user.created', payload: { userId: 'u1' }, emittedAt: 0 });
    expect(results.length).toBe(2);
    expect(results.every((r) => r.status === 'completed')).toBe(true);
  });

  it('T-INT-W-004 retryStep 経由 workflow step が eventually succeed', async () => {
    let attempts = 0;
    const result = await retryStep(
      async () => {
        attempts += 1;
        if (attempts < 2) throw new Error('flaky');
        return { computedAt: attempts };
      },
      { maxAttempts: 3, baseDelayMs: 1, sleep: async () => {} },
    );
    expect(result.succeeded).toBe(true);
    expect(result.value?.computedAt).toBe(2);
  });

  it('T-INT-W-005 dispose 後は event trigger が発火しない', async () => {
    const client = createWorkflowClient({ provider: 'aws-sfn' });
    const wf = defineWorkflow('h', [{ name: 's', run: () => ({}) }]);
    const handle = eventDrivenTrigger(client, 'e', wf);
    await emitEvent(client, { name: 'e', payload: {}, emittedAt: 0 });
    expect(handle.handledCount()).toBe(1);
    handle.dispose();
    const results = await emitEvent(client, { name: 'e', payload: {}, emittedAt: 1 });
    expect(results.length).toBe(0);
    expect(handle.handledCount()).toBe(1);
  });
});
