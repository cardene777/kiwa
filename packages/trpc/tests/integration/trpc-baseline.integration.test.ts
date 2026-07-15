/**
 * integration test — trpc domain の end-to-end workflow (router 構築 → middleware chain →
 * client 経由 procedure 実行 → error propagation) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createRouter,
  defineProcedure,
  invokeProcedure,
  createClient,
  middleware,
  TRPCError,
  withRetry,
  withRateLimit,
  withObservability,
  batchInvoke,
  withCircuitBreaker,
} from '../../src/index.js';

describe('trpc integration — router → middleware → client workflow', () => {
  it('T-INT-T-001 client 経由の query が router handler の戻り値を透過的に返す', async () => {
    const router = createRouter({
      procedures: {
        greet: defineProcedure('query', async ({ input }) => `hi ${(input as { name: string }).name}`),
      },
    });
    const client = createClient(router);
    expect(await client.greet!.query({ name: 'kiwa' })).toBe('hi kiwa');
  });

  it('T-INT-T-002 global middleware が全 procedure 呼出前に走る', async () => {
    const calls: string[] = [];
    const trace = middleware(async ({ path, next }) => {
      calls.push(path);
      return next();
    });
    const router = createRouter({
      procedures: {
        a: defineProcedure('query', async () => 1),
        b: defineProcedure('query', async () => 2),
      },
      middlewares: [trace],
    });
    await invokeProcedure(router, 'a', undefined);
    await invokeProcedure(router, 'b', undefined);
    expect(calls).toEqual(['a', 'b']);
  });

  it('T-INT-T-003 auth middleware で ctx.userId 欠落時 UNAUTHORIZED', async () => {
    const auth = middleware(async ({ ctx, next }) =>
      ctx.userId ? next() : { ok: false, error: new TRPCError({ code: 'UNAUTHORIZED' }) },
    );
    const router = createRouter({
      procedures: {
        me: defineProcedure('query', async ({ ctx }) => ctx.userId, [auth]),
      },
    });
    await expect(invokeProcedure(router, 'me', undefined, {})).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(await invokeProcedure(router, 'me', undefined, { userId: 'u1' })).toBe('u1');
  });

  it('T-INT-T-004 mutation の副作用が外部 state に伝わる', async () => {
    const store = new Map<string, string>();
    const router = createRouter({
      procedures: {
        set: defineProcedure('mutation', async ({ input }) => {
          const i = input as { k: string; v: string };
          store.set(i.k, i.v);
          return { ok: true };
        }),
        get: defineProcedure('query', async ({ input }) => store.get((input as { k: string }).k)),
      },
    });
    const client = createClient(router);
    await client.set!.mutate({ k: 'a', v: '1' });
    expect(await client.get!.query({ k: 'a' })).toBe('1');
  });

  it('T-INT-T-005 handler throw が TRPCError に包まれて client 側に伝わる', async () => {
    const router = createRouter({
      procedures: {
        boom: defineProcedure('mutation', async () => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'kaboom' });
        }),
      },
    });
    const client = createClient(router);
    await expect(client.boom!.mutate()).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });

  it('T-INT-T-006 withRetry backoff で 2 回目 retry まで delay 発生', async () => {
    let attempts = 0;
    const handler = withRetry(async () => {
      attempts += 1;
      if (attempts < 2) throw new Error('retry me');
      return { attempt: attempts };
    }, { maxAttempts: 3, backoffMs: 5 });
    const router = createRouter({ procedures: { r: defineProcedure('query', handler) } });
    const t0 = Date.now();
    const result = await invokeProcedure(router, 'r', undefined) as { attempt: number };
    expect(result.attempt).toBe(2);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(5);
  });

  it('T-INT-T-007 withRateLimit で window 内 maxRequests 超過が rejected', async () => {
    const handler = withRateLimit(async () => 'ok', { maxRequests: 3, windowMs: 1000 });
    const router = createRouter({ procedures: { lim: defineProcedure('query', handler) } });
    for (let i = 0; i < 3; i += 1) {
      await invokeProcedure(router, 'lim', undefined);
    }
    await expect(invokeProcedure(router, 'lim', undefined)).rejects.toThrow(/rate limit/);
  });

  it('T-INT-T-008 withObservability = start/success/error hook が正しい順で発火', async () => {
    const events: string[] = [];
    const hook = {
      onStart: (name: string) => events.push(`start:${name}`),
      onSuccess: (name: string) => events.push(`success:${name}`),
      onError: (name: string) => events.push(`error:${name}`),
    };
    const okHandler = withObservability('op', async () => 'ok', hook);
    const errHandler = withObservability('op', async () => { throw new Error('nope'); }, hook);
    const router = createRouter({
      procedures: {
        ok: defineProcedure('query', okHandler),
        err: defineProcedure('query', errHandler),
      },
    });
    await invokeProcedure(router, 'ok', undefined);
    await expect(invokeProcedure(router, 'err', undefined)).rejects.toThrow();
    expect(events).toEqual(['start:op', 'success:op', 'start:op', 'error:op']);
  });

  it('T-INT-T-009 batchInvoke で 3 procedure 並列 + error isolation で partial pass', async () => {
    const router = createRouter({
      procedures: {
        a: defineProcedure('query', async () => 'A'),
        b: defineProcedure('query', async () => { throw new TRPCError({ code: 'BAD_REQUEST' }); }),
        c: defineProcedure('query', async () => 'C'),
      },
    });
    const results = await batchInvoke(router, [
      { procedureName: 'a', input: undefined },
      { procedureName: 'b', input: undefined },
      { procedureName: 'c', input: undefined },
    ]);
    expect(results.filter((r) => r.ok).length).toBe(2);
    expect(results.filter((r) => !r.ok).length).toBe(1);
  });

  it('T-INT-T-010 withCircuitBreaker + retry の chain で resilience 統合', async () => {
    let failures = 0;
    const breaker = withCircuitBreaker(async () => {
      failures += 1;
      throw new Error('external down');
    }, { failureThreshold: 3, resetMs: 1000 });
    const router = createRouter({ procedures: { flaky: defineProcedure('query', breaker) } });
    for (let i = 0; i < 3; i += 1) {
      await expect(invokeProcedure(router, 'flaky', undefined)).rejects.toThrow();
    }
    await expect(invokeProcedure(router, 'flaky', undefined)).rejects.toThrow('circuit breaker open');
    expect(failures).toBe(3);
  });
});
