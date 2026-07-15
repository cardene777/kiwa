/**
 * integration test — rust-lib domain の end-to-end workflow (env → route add → invoke →
 * middleware trace → guard verify) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createRustAppEnv,
  invokeAxumHandler,
  invokeActixHandler,
  captureTowerMiddleware,
  invokeRocketRoute,
} from '../../src/index.js';

describe('rust-lib integration — framework end-to-end workflow', () => {
  it('T-INT-R-001 axum env で route 3 個 register → 全 match', () => {
    const env = createRustAppEnv({ framework: 'axum' });
    env.addRoute({ method: 'GET', path: '/a', handler: async () => 1 });
    env.addRoute({ method: 'POST', path: '/b', handler: async () => 2 });
    env.addRoute({ method: 'DELETE', path: '/c', handler: async () => 3 });
    expect(env.matchRoute('GET', '/a')).toBeDefined();
    expect(env.matchRoute('POST', '/b')).toBeDefined();
    expect(env.matchRoute('DELETE', '/c')).toBeDefined();
    expect(env.listRoutes().length).toBe(3);
  });

  it('T-INT-R-002 tower middleware 3 段 chain で entered/exited 全 record', async () => {
    const mkMw = () => async (req: { method: string; path: string; headers: Record<string, string> }, next: (r: typeof req) => Promise<{ status: number; body: unknown }>) => next(req);
    const trace = await captureTowerMiddleware({
      middleware: [mkMw(), mkMw(), mkMw()],
      request: { method: 'GET', path: '/x', headers: {} },
      handler: async () => ({ status: 200, body: 'ok' }),
    });
    expect(trace.entered).toEqual(['middleware-1', 'middleware-2', 'middleware-3']);
    expect(trace.exited).toEqual(['middleware-3', 'middleware-2', 'middleware-1']);
  });

  it('T-INT-R-003 actix handler で body を受け取り response return', async () => {
    const res = await invokeActixHandler<{ n: number }>({
      handler: async (req) => ({ doubled: (req?.n ?? 0) * 2 }),
      method: 'POST',
      path: '/double',
      body: { n: 21 },
    });
    expect(res.body).toEqual({ doubled: 42 });
  });

  it('T-INT-R-004 rocket route で guards passed 全 record', async () => {
    const res = await invokeRocketRoute({
      route: async () => 'protected content',
      method: 'GET',
      path: '/admin',
      guards: ['Auth', 'Admin', 'RateLimit'],
    });
    expect(res.guardsPassed).toEqual(['Auth', 'Admin', 'RateLimit']);
    expect(res.body).toBe('protected content');
  });

  it('T-INT-R-005 env.clear() で route registry が空になる', () => {
    const env = createRustAppEnv({ framework: 'actix-web' });
    env.addRoute({ method: 'GET', path: '/x', handler: async () => null });
    expect(env.listRoutes().length).toBe(1);
    env.clear();
    expect(env.listRoutes().length).toBe(0);
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
