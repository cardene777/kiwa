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
});
