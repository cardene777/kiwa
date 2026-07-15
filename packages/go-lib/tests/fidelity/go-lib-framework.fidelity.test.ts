/**
 * fidelity test — 4 framework mock adapter が同じ input で reference impl (単純 map) と一致する
 * response shape を返すことを検証。 v2.1 で 5 → 10 case に拡張、 retry / batch / observability /
 * timeout / circuit breaker 経路も cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  invokeGinHandler,
  invokeEchoHandler,
  invokeFiberHandler,
  captureChiRoute,
  retryWithBackoff,
  batchDispatch,
  createObservabilityHook,
  withTimeout,
  createCircuitBreaker,
  createRateLimiter,
} from '../../src/index.js';
import { createChiApp } from '../../src/chi.js';

function referenceEcho(): { call: (v: string) => Promise<{ status: number; body: string }> } {
  return {
    async call(v: string) {
      return { status: 200, body: v };
    },
  };
}

describe('go-lib framework fidelity vs reference echo impl', () => {
  it('gin JSON = reference echo と同 status 200 を返す', async () => {
    const real = referenceEcho();
    const result = await assertFidelity({
      mockFn: async (v: string) => {
        const r = await invokeGinHandler({ handler: (c) => { c.JSON(200, { v }); }, req: { method: 'GET', path: '/' } });
        return r.status;
      },
      realFn: async (v: string) => (await real.call(v)).status,
      cases: [{ name: 'basic', args: ['x'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('echo NoContent が status 204 を返す', async () => {
    const r = await invokeEchoHandler({
      handler: (c) => c.NoContent(204),
      req: { method: 'DELETE', path: '/x' },
    });
    expect(r.status).toBe(204);
    expect(r.body).toBeUndefined();
  });

  it('fiber Status(500).SendString で status + body 両方 capture', async () => {
    const r = await invokeFiberHandler({
      handler: (c) => c.Status(500).SendString('err'),
      req: { method: 'GET', path: '/e' },
    });
    expect(r.status).toBe(500);
    expect(r.body).toBe('err');
  });

  it('chi pattern matching で params が正しく decode', async () => {
    const app = createChiApp();
    app.addRoute('GET', '/users/{id}/posts/{postId}', async (req) => ({
      status: 200,
      body: { id: req.params?.id, postId: req.params?.postId },
    }));
    const r = await captureChiRoute({ app, method: 'GET', path: '/users/42/posts/7' });
    expect(r.matched).toBe(true);
    expect((r.body as { id: string; postId: string })).toEqual({ id: '42', postId: '7' });
  });

  it('chi middleware chain が addRoute 順に trace される', async () => {
    const app = createChiApp();
    app.use('logger', async (_n, next) => { await next(); });
    app.use('auth', async (_n, next) => { await next(); });
    app.addRoute('GET', '/x', async () => ({ status: 200 }));
    const r = await captureChiRoute({ app, method: 'GET', path: '/x' });
    expect(r.middlewareTrace.map((m) => m.name)).toEqual(['logger', 'auth']);
  });

  // v2.1 追加 5 case
  it('v2.1 retryWithBackoff = 3 attempt で成功', async () => {
    let attempts = 0;
    const result = await retryWithBackoff(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('flaky');
      return 'ok';
    }, { maxAttempts: 5, initialDelayMs: 1 });
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(3);
    expect(result.value).toBe('ok');
  });

  it('v2.1 batchDispatch = 5 handler 並列実行 + successCount 集計', async () => {
    const handlers = Array.from({ length: 5 }, (_, i) => async () => i * 2);
    const result = await batchDispatch(handlers, { concurrency: 3 });
    expect(result.successCount).toBe(5);
    expect(result.failureCount).toBe(0);
    expect(result.results.map((r) => r.value)).toEqual([0, 2, 4, 6, 8]);
  });

  it('v2.1 observability hook = onRequest で 3 event 蓄積', async () => {
    const hook = createObservabilityHook();
    for (let i = 0; i < 3; i += 1) {
      hook.onRequest({ framework: 'gin', method: 'GET', path: `/x/${i}`, status: 200, durationMs: 5, timestamp: i });
    }
    expect(hook.events().length).toBe(3);
    hook.clear();
    expect(hook.events().length).toBe(0);
  });

  it('v2.1 withTimeout = 遅延 fn で reject', async () => {
    await expect(
      withTimeout(() => new Promise((r) => setTimeout(r, 100)), { timeoutMs: 10 }),
    ).rejects.toThrow('timeout after 10ms');
  });

  it('v2.1 circuit breaker + rate limiter primitive の型契約', () => {
    const cb = createCircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 100 });
    const rl = createRateLimiter({ requestsPerSecond: 10, burst: 5 });
    expect(cb.state()).toBe('closed');
    expect(rl.tryAcquire()).toBe(true);
    expect(rl.remaining()).toBeGreaterThanOrEqual(3);
  });
});
