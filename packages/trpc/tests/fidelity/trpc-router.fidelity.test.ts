/**
 * fidelity test — createRouter + invokeProcedure (kiwa mock) が reference impl (単純な
 * Map ベースの handler dispatch) と同じ挙動を示すことを検証。 5 case で query / mutation /
 * middleware chain / not-found / typed client の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createRouter,
  defineProcedure,
  invokeProcedure,
  createClient,
  middleware,
  TRPCError,
  withRetry,
  withTimeout,
  withCircuitBreaker,
  withIdempotencyKey,
  batchInvoke,
} from '../../src/index.js';

function referenceRouter() {
  const handlers = new Map<string, (input: unknown) => Promise<unknown> | unknown>();
  return {
    define(path: string, handler: (input: unknown) => Promise<unknown> | unknown) {
      handlers.set(path, handler);
    },
    async call(path: string, input: unknown) {
      const h = handlers.get(path);
      if (!h) throw new Error('not-found');
      return h(input);
    },
  };
}

describe('trpc router fidelity vs reference impl', () => {
  it('query = input を echo する挙動が reference と一致', async () => {
    const router = createRouter({
      procedures: { echo: defineProcedure('query', async ({ input }) => input) },
    });
    const ref = referenceRouter();
    ref.define('echo', (input) => input);
    const result = await assertFidelity({
      mockFn: async (v: number) => invokeProcedure(router, 'echo', v),
      realFn: async (v: number) => ref.call('echo', v),
      cases: [{ name: 'echo 42', args: [42] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('mutation で input を加工して return', async () => {
    const router = createRouter({
      procedures: {
        add: defineProcedure('mutation', async ({ input }) => {
          const i = input as { a: number; b: number };
          return i.a + i.b;
        }),
      },
    });
    expect(await invokeProcedure(router, 'add', { a: 3, b: 4 })).toBe(7);
  });

  it('middleware chain で ctx を変換して handler に渡す', async () => {
    const injectUser = middleware(async ({ next }) => next({ ctx: { userId: 'injected' } }));
    const router = createRouter({
      procedures: {
        me: defineProcedure('query', async ({ ctx }) => ctx.userId, [injectUser]),
      },
    });
    expect(await invokeProcedure(router, 'me', undefined)).toBe('injected');
  });

  it('存在しない path で TRPCError NOT_FOUND', async () => {
    const router = createRouter({ procedures: {} });
    await expect(invokeProcedure(router, 'missing', undefined)).rejects.toBeInstanceOf(TRPCError);
  });

  it('typed client (client.foo.query) が invokeProcedure と等価', async () => {
    const router = createRouter({
      procedures: { ping: defineProcedure('query', async () => 'pong') },
    });
    const client = createClient(router);
    expect(await client.ping!.query()).toBe('pong');
    expect(await invokeProcedure(router, 'ping', undefined)).toBe('pong');
  });

  it('withRetry = 一時 error を maxAttempts 回まで retry して最終成功', async () => {
    let attempts = 0;
    const flakyHandler = withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('flaky');
      return 'ok';
    }, { maxAttempts: 5 });
    const router = createRouter({
      procedures: { flaky: defineProcedure('query', flakyHandler) },
    });
    expect(await invokeProcedure(router, 'flaky', undefined)).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('withTimeout = ms 超過で timeout error throw', async () => {
    const slowHandler = withTimeout(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return 'never';
    }, { ms: 5 });
    const router = createRouter({
      procedures: { slow: defineProcedure('query', slowHandler) },
    });
    await expect(invokeProcedure(router, 'slow', undefined)).rejects.toThrow(/timeout/);
  });

  it('withCircuitBreaker = failureThreshold 超で open 状態', async () => {
    const brokenHandler = withCircuitBreaker(async () => { throw new Error('down'); }, {
      failureThreshold: 2, resetMs: 1000,
    });
    const router = createRouter({
      procedures: { broken: defineProcedure('query', brokenHandler) },
    });
    await expect(invokeProcedure(router, 'broken', undefined)).rejects.toThrow('down');
    await expect(invokeProcedure(router, 'broken', undefined)).rejects.toThrow('down');
    await expect(invokeProcedure(router, 'broken', undefined)).rejects.toThrow('circuit breaker open');
  });

  it('withIdempotencyKey = 同一 key の 2 回目呼出で cache 返却', async () => {
    let counter = 0;
    const chargeHandler = withIdempotencyKey<{ ok: true; id: number }>(async () => {
      counter += 1;
      return { ok: true as const, id: counter };
    });
    const router = createRouter({
      procedures: { charge: defineProcedure('mutation', chargeHandler) },
    });
    const r1 = await invokeProcedure(router, 'charge', { idempotencyKey: 'k1' }) as { id: number };
    const r2 = await invokeProcedure(router, 'charge', { idempotencyKey: 'k1' }) as { id: number };
    expect(r1.id).toBe(r2.id);
    expect(counter).toBe(1);
  });

  it('batchInvoke = 複数 procedure を並列 invoke + individual failure isolation', async () => {
    const router = createRouter({
      procedures: {
        good: defineProcedure('query', async ({ input }) => (input as { n: number }).n * 2),
        bad: defineProcedure('query', async () => { throw new TRPCError({ code: 'BAD_REQUEST', message: 'nope' }); }),
      },
    });
    const results = await batchInvoke(router, [
      { procedureName: 'good', input: { n: 5 } },
      { procedureName: 'bad', input: {} },
      { procedureName: 'good', input: { n: 10 } },
    ]);
    expect(results[0]!.ok).toBe(true);
    expect(results[0]!.output).toBe(10);
    expect(results[1]!.ok).toBe(false);
    expect(results[2]!.output).toBe(20);
  });
});
