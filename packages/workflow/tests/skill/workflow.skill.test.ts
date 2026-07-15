/**
 * skill test — workflow skill が主要 API 5 種 (createWorkflowClient / defineWorkflow /
 * executeWorkflow / retryStep / eventDrivenTrigger) を全て公開している + provider 別に
 * 動作分岐することを skill-test primitive 経由で assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createWorkflowClient,
  defineWorkflow,
  retryStep,
  eventDrivenTrigger,
  emitEvent,
} from '../../src/index.js';

describe('workflow skill assertions', () => {
  it('createWorkflowClient を 4 provider (temporal/inngest/trigger/aws-sfn) 全てで instantiate 可能', () => {
    for (const provider of ['temporal', 'inngest', 'trigger', 'aws-sfn'] as const) {
      const client = createWorkflowClient({ provider });
      expect(client.provider).toBe(provider);
    }
  });

  it('provider 別に execute id prefix が異なる', async () => {
    const temporal = createWorkflowClient({ provider: 'temporal' });
    const inngest = createWorkflowClient({ provider: 'inngest' });
    temporal.register(defineWorkflow('w', [{ name: 's', run: () => ({}) }]));
    inngest.register(defineWorkflow('w', [{ name: 's', run: () => ({}) }]));
    const t = await temporal.execute('w', {});
    const i = await inngest.execute('w', {});
    expect(t.id.startsWith('wf-')).toBe(true);
    expect(i.id.startsWith('ing-')).toBe(true);
  });

  it('retryStep が exponential backoff で delaysMs を蓄積', async () => {
    let attempts = 0;
    const result = await retryStep(
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('fail');
        return 'ok';
      },
      { maxAttempts: 3, baseDelayMs: 10, sleep: async () => {} },
    );
    expect(result.succeeded).toBe(true);
    expect(result.attempts).toBe(3);
    expect(result.delaysMs).toEqual([10, 20]);
  });

  it('retryStep が maxAttempts 到達で failed 結果を返す', async () => {
    const result = await retryStep(
      async () => { throw new Error('always'); },
      { maxAttempts: 2, baseDelayMs: 1, sleep: async () => {} },
    );
    expect(result.succeeded).toBe(false);
    expect(result.error).toBe('always');
  });

  it('eventDrivenTrigger + emitEvent で登録済 workflow が実行される', async () => {
    const client = createWorkflowClient({ provider: 'inngest' });
    const wf = defineWorkflow('handler', [{ name: 's', run: () => ({ handled: true }) }]);
    const handle = eventDrivenTrigger(client, 'user.signup', wf);
    await emitEvent(client, { name: 'user.signup', payload: { userId: 'u1' }, emittedAt: 0 });
    await emitEvent(client, { name: 'user.signup', payload: { userId: 'u2' }, emittedAt: 1 });
    expect(handle.handledCount()).toBe(2);
  });
});
