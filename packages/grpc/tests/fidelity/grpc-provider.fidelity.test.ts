import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createGrpcServer,
  defineService,
  invokeUnary,
  invokeServerStream,
  invokeBidi,
  createDeadlineContext,
  remainingDeadlineMs,
  isDeadlineExceeded,
  composeInterceptors,
  createCancelToken,
  type Interceptor,
} from '../../src/index.js';

function referenceServer() {
  const services = new Map<string, Map<string, (req: unknown) => unknown>>();
  return {
    addUnary(svc: string, name: string, fn: (req: unknown) => unknown) {
      if (!services.has(svc)) services.set(svc, new Map());
      services.get(svc)!.set(name, fn);
    },
    async call(svc: string, name: string, req: unknown) {
      return services.get(svc)?.get(name)?.(req);
    },
  };
}

describe('grpc server fidelity v2.1', () => {
  it('invokeUnary = reference impl と同じ結果', async () => {
    const mock = createGrpcServer({ provider: 'grpc-js' });
    mock.addService(defineService('Echo', [{ name: 'ping', type: 'unary', handler: async (r: unknown) => ({ pong: (r as { v: number }).v }) }]));
    const real = referenceServer();
    real.addUnary('Echo', 'ping', (r: unknown) => ({ pong: (r as { v: number }).v }));

    const result = await assertFidelity({
      mockFn: async (v: number) => (await invokeUnary(mock, 'Echo', 'ping', { v })).response,
      realFn: async (v: number) => real.call('Echo', 'ping', { v }),
      cases: [{ name: 'basic', args: [42] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('4 provider 全てで unary が同じ shape を返す', async () => {
    for (const provider of ['grpc-js', 'nice-grpc', 'twirp', 'connect'] as const) {
      const s = createGrpcServer({ provider });
      s.addService(defineService('E', [{ name: 'p', type: 'unary', handler: async () => ({ ok: true }) }]));
      const r = await invokeUnary(s, 'E', 'p', {});
      expect(r.ok).toBe(true);
      expect(r.status.code).toBe(0);
    }
  });

  it('server-stream で複数 response を配列に集約', async () => {
    const s = createGrpcServer({ provider: 'grpc-js' });
    s.addService(defineService('E', [{ name: 's', type: 'server-stream', handler: async function* () { yield 1; yield 2; yield 3; } }]));
    const r = await invokeServerStream(s, 'E', 's', {});
    expect(r.responses).toEqual([1, 2, 3]);
  });

  it('bidi で reqs → responses が対応順序で処理', async () => {
    const s = createGrpcServer({ provider: 'grpc-js' });
    s.addService(
      defineService('E', [
        { name: 'b', type: 'bidi', handler: async function* (reqs: AsyncIterable<unknown>) { for await (const r of reqs) yield { r }; } },
      ]),
    );
    const r = await invokeBidi(s, 'E', 'b', [{ n: 1 }, { n: 2 }]);
    expect(r.responses.length).toBe(2);
  });

  it('handler throw で non-zero status.code', async () => {
    const s = createGrpcServer({ provider: 'grpc-js' });
    s.addService(defineService('E', [{ name: 'fail', type: 'unary', handler: async () => { throw Object.assign(new Error('x'), { code: 5 }); } }]));
    const r = await invokeUnary(s, 'E', 'fail', {});
    expect(r.ok).toBe(false);
    expect(r.status.code).toBe(5);
  });

  it('deadline context = remainingMs が経過で減少 → exceeded', () => {
    let t = 0;
    const ctx = createDeadlineContext(1000, () => t);
    expect(remainingDeadlineMs(ctx)).toBe(1000);
    t = 500;
    expect(remainingDeadlineMs(ctx)).toBe(500);
    t = 1500;
    expect(isDeadlineExceeded(ctx)).toBe(true);
  });

  it('interceptor chain = 順序どおり before/after fires', async () => {
    const log: string[] = [];
    const a: Interceptor = async (_ctx, next) => { log.push('a-before'); const r = await next(); log.push('a-after'); return r; };
    const b: Interceptor = async (_ctx, next) => { log.push('b-before'); const r = await next(); log.push('b-after'); return r; };
    const chain = composeInterceptors([a, b]);
    await chain(
      { service: 'S', method: 'M', metadata: [], request: {} },
      async () => ({ response: 'ok', status: { code: 0, message: '' } }),
    );
    expect(log).toEqual(['a-before', 'b-before', 'b-after', 'a-after']);
  });

  it('interceptor short-circuit = next() 呼ばない = final skip', async () => {
    let finalCalled = false;
    const gate: Interceptor = async () => ({ status: { code: 7, message: 'denied' } });
    const chain = composeInterceptors([gate]);
    const r = await chain(
      { service: 'S', method: 'M', metadata: [], request: {} },
      async () => { finalCalled = true; return { status: { code: 0, message: '' } }; },
    );
    expect(finalCalled).toBe(false);
    expect(r.status.code).toBe(7);
  });

  it('cancel token = cancel 発火で onCancel handler が呼ばれる', () => {
    const token = createCancelToken();
    let reason: string | undefined;
    token.onCancel((r) => { reason = r; });
    token.cancel('client abort');
    expect(token.isCanceled()).toBe(true);
    expect(reason).toBe('client abort');
  });

  it('cancel token = cancel 後の onCancel は即 fire', () => {
    const token = createCancelToken();
    token.cancel('already');
    let called = false;
    token.onCancel(() => { called = true; });
    expect(called).toBe(true);
  });
});
