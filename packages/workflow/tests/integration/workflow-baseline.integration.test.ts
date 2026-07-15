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

describe('v2.1 resilience integration', () => {
  it('T-INT-V21-001 batchOperate runs items in parallel with per-item error isolation', async () => {
    const { batchOperate } = await import('../../src/index.js');
    const results = await batchOperate(
      [{ name: 'a', input: 1 }, { name: 'b', input: 2 }, { name: 'c', input: 3 }],
      async (item) => {
        if (item.name === 'b') throw new Error('bad');
        return (item.input as number) * 10;
      },
    );
    expect(results.filter((r) => r.ok).length).toBe(2);
    expect(results.filter((r) => !r.ok).length).toBe(1);
  });

  it('T-INT-V21-002 withRetry + withTimeout can be composed', async () => {
    const { withRetry, withTimeout } = await import('../../src/index.js');
    let calls = 0;
    const slow = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return 'done';
    };
    const wrapped = withRetry(withTimeout(slow, { ms: 5 }), { maxAttempts: 2 });
    await expect(wrapped()).rejects.toThrow(/timeout/);
    expect(calls).toBe(2);
  });

  it('T-INT-V21-003 withObservability fires start/success hooks in order', async () => {
    const { withObservability } = await import('../../src/index.js');
    const events: string[] = [];
    const wrapped = withObservability('op', async () => 'ok', {
      onStart: () => events.push('start'),
      onSuccess: () => events.push('success'),
    });
    await wrapped();
    expect(events).toEqual(['start', 'success']);
  });

  it('T-INT-V21-004 withObservability captures error path', async () => {
    const { withObservability } = await import('../../src/index.js');
    const events: string[] = [];
    const wrapped = withObservability('op', async () => { throw new Error('nope'); }, {
      onStart: () => events.push('start'),
      onError: () => events.push('error'),
    });
    await expect(wrapped()).rejects.toThrow('nope');
    expect(events).toEqual(['start', 'error']);
  });

  it('T-INT-V21-005 withRetry retryOn callback conditionally suppresses retry', async () => {
    const { withRetry } = await import('../../src/index.js');
    let calls = 0;
    const wrapped = withRetry(async () => {
      calls += 1;
      throw new Error('fatal');
    }, { maxAttempts: 5, retryOn: (err) => (err as Error).message !== 'fatal' });
    await expect(wrapped()).rejects.toThrow('fatal');
    expect(calls).toBe(1);
  });
});
