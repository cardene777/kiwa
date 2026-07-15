/**
 * skill test — trpc skill が主要 API 6 種 (createRouter / defineProcedure / invokeProcedure /
 * createClient / middleware / TRPCError) + createContext helper を全て公開している + 3 種
 * procedure type (query / mutation / subscription) と 5 種 error code に対応することを assertion。
 */
import { describe, expect, it } from 'vitest';
import {
  createRouter,
  defineProcedure,
  invokeProcedure,
  createClient,
  middleware,
  TRPCError,
  createContext,
} from '../../src/index.js';

describe('trpc skill assertions', () => {
  it('defineProcedure が 3 種 (query / mutation / subscription) 全てで definition を返す', () => {
    for (const type of ['query', 'mutation', 'subscription'] as const) {
      const proc = defineProcedure(type, () => 'ok');
      expect(proc.type).toBe(type);
      expect(typeof proc.handler).toBe('function');
    }
  });

  it('TRPCError が 5 種 code 全てで instantiate 可能', () => {
    for (const code of [
      'BAD_REQUEST',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'INTERNAL_SERVER_ERROR',
    ] as const) {
      const err = new TRPCError({ code, message: 'x' });
      expect(err.code).toBe(code);
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('createContext が options 別に ctx を構築 (options 省略 = 空 ctx)', () => {
    expect(createContext()).toEqual({});
    expect(createContext({ userId: 'u1', headers: { a: '1' } })).toEqual({
      userId: 'u1',
      headers: { a: '1' },
    });
  });

  it('middleware helper が Middleware 型を wrap して chain 可能にする', async () => {
    const traced: string[] = [];
    const mw1 = middleware(async ({ next }) => {
      traced.push('mw1');
      return next();
    });
    const mw2 = middleware(async ({ next }) => {
      traced.push('mw2');
      return next();
    });
    const router = createRouter({
      procedures: {
        run: defineProcedure(
          'query',
          async () => {
            traced.push('handler');
            return 'ok';
          },
          [mw1, mw2],
        ),
      },
    });
    await invokeProcedure(router, 'run', undefined);
    expect(traced).toEqual(['mw1', 'mw2', 'handler']);
  });

  it('createClient が Proxy で任意 path に query/mutate/subscribe を expose', async () => {
    const router = createRouter({
      procedures: {
        'nested.path': defineProcedure('query', async () => 'nested-ok'),
      },
    });
    const client = createClient(router);
    expect(typeof client['nested.path']!.query).toBe('function');
    expect(typeof client['nested.path']!.mutate).toBe('function');
    expect(typeof client['nested.path']!.subscribe).toBe('function');
    expect(await client['nested.path']!.query()).toBe('nested-ok');
  });
});
