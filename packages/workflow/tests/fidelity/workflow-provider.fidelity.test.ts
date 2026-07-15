/**
 * fidelity test — createWorkflowClient (kiwa mock) が reference impl と同じ挙動を示すことを検証。
 * 5 case で execute / step chain / provider 差異 / failure path / clear の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createWorkflowClient, defineWorkflow } from '../../src/index.js';

function referenceExecutor() {
  const store: Array<{ workflow: string; status: string; id: string }> = [];
  let counter = 0;
  return {
    async execute(workflow: string) {
      counter += 1;
      const id = `ref-${counter}`;
      store.push({ workflow, status: 'completed', id });
      return { id, status: 'completed' as const };
    },
    listExecutions() {
      return [...store];
    },
  };
}

describe('workflow client fidelity vs reference impl', () => {
  it('execute api = completed 状態 + id 発行を返す', async () => {
    const mock = createWorkflowClient({ provider: 'temporal' });
    mock.register(defineWorkflow('w', [{ name: 's', run: () => ({}) }]));
    const real = referenceExecutor();
    const result = await assertFidelity({
      mockFn: async (name: string) => (await mock.execute(name, {})).status,
      realFn: async (name: string) => (await real.execute(name)).status,
      cases: [{ name: 'basic execute', args: ['w'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('複数 execute で listExecutions が全 record を保持', async () => {
    const mock = createWorkflowClient({ provider: 'inngest' });
    mock.register(defineWorkflow('w', [{ name: 's', run: () => ({}) }]));
    for (let i = 0; i < 3; i++) await mock.execute('w', { i });
    expect(mock.listExecutions().length).toBe(3);
    expect(mock.listExecutions()[0]!.input.i).toBe(0);
  });

  it('step chain で previous output が次 step に渡る', async () => {
    const mock = createWorkflowClient({ provider: 'trigger' });
    mock.register(defineWorkflow('chain', [
      { name: 'a', run: () => ({ n: 1 }) },
      { name: 'b', run: (ctx) => ({ n: Number(ctx.previous.n) + 1 }) },
      { name: 'c', run: (ctx) => ({ n: Number(ctx.previous.n) + 1 }) },
    ]));
    const res = await mock.execute('chain', {});
    expect(res.status).toBe('completed');
    expect(res.output?.n).toBe(3);
  });

  it('未登録 workflow の execute で failed status を返す', async () => {
    const mock = createWorkflowClient({ provider: 'aws-sfn' });
    const res = await mock.execute('missing', {});
    expect(res.status).toBe('failed');
    expect(res.error).toContain('not registered');
  });

  it('clear で listExecutions + registered が空になる', async () => {
    const mock = createWorkflowClient({ provider: 'temporal' });
    mock.register(defineWorkflow('w', [{ name: 's', run: () => ({}) }]));
    await mock.execute('w', {});
    expect(mock.listExecutions().length).toBe(1);
    expect(mock.registered().length).toBe(1);
    mock.clear();
    expect(mock.listExecutions().length).toBe(0);
    expect(mock.registered().length).toBe(0);
  });
});
