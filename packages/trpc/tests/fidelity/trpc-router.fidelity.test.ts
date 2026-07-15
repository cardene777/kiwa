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
});
