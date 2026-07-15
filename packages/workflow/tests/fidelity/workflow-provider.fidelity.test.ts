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

describe('v2.1 resilience primitives (generic)', () => {
  it('withRetry recovers after transient failure and eventually succeeds', async () => {
    const { withRetry } = await import('../../src/index.js');
    let attempts = 0;
    const wrapped = withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('flaky');
      return 'ok';
    }, { maxAttempts: 5 });
    expect(await wrapped()).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('withTimeout rejects after ms elapsed', async () => {
    const { withTimeout } = await import('../../src/index.js');
    const wrapped = withTimeout(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return 'never';
    }, { ms: 5 });
    await expect(wrapped()).rejects.toThrow(/timeout/);
  });

  it('withRateLimit throws when exceeding maxRequests', async () => {
    const { withRateLimit } = await import('../../src/index.js');
    const wrapped = withRateLimit(async () => 'ok', { maxRequests: 2, windowMs: 1000 });
    await wrapped();
    await wrapped();
    await expect(wrapped()).rejects.toThrow(/rate limit/);
  });

  it('withCircuitBreaker opens after failureThreshold and rejects further calls', async () => {
    const { withCircuitBreaker } = await import('../../src/index.js');
    const wrapped = withCircuitBreaker(async () => { throw new Error('down'); }, {
      failureThreshold: 2, resetMs: 1000,
    });
    await expect(wrapped()).rejects.toThrow('down');
    await expect(wrapped()).rejects.toThrow('down');
    await expect(wrapped()).rejects.toThrow('circuit breaker open');
  });

  it('withIdempotencyKey returns cached result on duplicate key', async () => {
    const { withIdempotencyKey } = await import('../../src/index.js');
    let counter = 0;
    const wrapped = withIdempotencyKey(async (_key: string) => {
      counter += 1;
      return { id: counter };
    });
    const a = await wrapped('K');
    const b = await wrapped('K');
    expect(a.id).toBe(b.id);
    expect(counter).toBe(1);
  });
});
