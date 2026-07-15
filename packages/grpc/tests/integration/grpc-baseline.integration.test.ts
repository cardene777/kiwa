import { describe, expect, it } from 'vitest';
import {
  createGrpcServer,
  defineService,
  invokeUnary,
  invokeServerStream,
  invokeClientStream,
  invokeBidi,
  createMetadata,
  STATUS_CODES,
  createDeadlineContext,
  isDeadlineExceeded,
  composeInterceptors,
  createCancelToken,
  type Interceptor,
} from '../../src/index.js';

describe('grpc integration v2.1 — end-to-end workflow', () => {
  it('T-INT-G-001 unary で req → res round-trip + metadata が handler に届く', async () => {
    const s = createGrpcServer({});
    let seenAuth = '';
    s.addService(
      defineService('Auth', [
        { name: 'login', type: 'unary', handler: async (req: unknown, md?: { key: string; value: string }[]) => {
          seenAuth = md?.find((e) => e.key === 'auth')?.value ?? '';
          return { token: `t-${(req as { user: string }).user}` };
        } },
      ]),
    );
    const r = await invokeUnary<{ user: string }, { token: string }>(s, 'Auth', 'login', { user: 'kiwa' }, createMetadata({ auth: 'bearer' }));
    expect(r.response?.token).toBe('t-kiwa');
    expect(seenAuth).toBe('bearer');
  });

  it('T-INT-G-002 server-stream で N item を全 consume', async () => {
    const s = createGrpcServer({});
    s.addService(
      defineService('Feed', [
        { name: 'items', type: 'server-stream', handler: async function* () { for (let i = 0; i < 5; i++) yield { id: i }; } },
      ]),
    );
    const r = await invokeServerStream<Record<string, never>, { id: number }>(s, 'Feed', 'items', {});
    expect(r.responses.length).toBe(5);
    expect(r.responses[4]?.id).toBe(4);
  });

  it('T-INT-G-003 client-stream で N req → 1 res 集約', async () => {
    const s = createGrpcServer({});
    s.addService(
      defineService('Agg', [
        { name: 'sum', type: 'client-stream', handler: async (reqs: AsyncIterable<{ v: number }>) => {
          let sum = 0;
          for await (const r of reqs) sum += r.v;
          return { sum };
        } },
      ]),
    );
    const r = await invokeClientStream<{ v: number }, { sum: number }>(s, 'Agg', 'sum', [{ v: 1 }, { v: 2 }, { v: 3 }]);
    expect(r.response?.sum).toBe(6);
  });

  it('T-INT-G-004 bidi で N req ↔ N res streaming', async () => {
    const s = createGrpcServer({});
    s.addService(
      defineService('Chat', [
        { name: 'talk', type: 'bidi', handler: async function* (reqs: AsyncIterable<{ msg: string }>) {
          for await (const r of reqs) yield { echo: `echo:${r.msg}` };
        } },
      ]),
    );
    const r = await invokeBidi<{ msg: string }, { echo: string }>(s, 'Chat', 'talk', [{ msg: 'a' }, { msg: 'b' }]);
    expect(r.responses.map((x) => x.echo)).toEqual(['echo:a', 'echo:b']);
  });

  it('T-INT-G-005 存在しない method 呼出で UNIMPLEMENTED (12) 返却', async () => {
    const s = createGrpcServer({});
    s.addService(defineService('S', [{ name: 'exists', type: 'unary', handler: async () => 1 }]));
    const r = await invokeUnary(s, 'S', 'missing', {});
    expect(r.ok).toBe(false);
    expect(r.status.code).toBe(STATUS_CODES.UNIMPLEMENTED);
  });

  it('T-INT-G-006 deadline gate = 期限超過で isDeadlineExceeded', async () => {
    let t = 0;
    const ctx = createDeadlineContext(100, () => t);
    t = 200;
    expect(isDeadlineExceeded(ctx)).toBe(true);
  });

  it('T-INT-G-007 interceptor chain = auth interceptor で UNAUTHENTICATED 短絡', async () => {
    const auth: Interceptor = async (ctx, next) => {
      const token = ctx.metadata.find((e) => e.key === 'auth')?.value;
      if (!token) return { status: { code: STATUS_CODES.UNAUTHENTICATED, message: 'no auth' } };
      return next();
    };
    const chain = composeInterceptors([auth]);
    const denied = await chain(
      { service: 'S', method: 'M', metadata: [], request: {} },
      async () => ({ response: 'ok', status: { code: 0, message: '' } }),
    );
    expect(denied.status.code).toBe(STATUS_CODES.UNAUTHENTICATED);
    const allowed = await chain(
      { service: 'S', method: 'M', metadata: createMetadata({ auth: 'bearer' }), request: {} },
      async () => ({ response: 'ok', status: { code: 0, message: '' } }),
    );
    expect(allowed.status.code).toBe(0);
  });

  it('T-INT-G-008 interceptor logging = before/after で time span 計測', async () => {
    let t = 0;
    let elapsed = 0;
    const log: Interceptor = async (_ctx, next) => {
      const start = t;
      t += 10;
      const r = await next();
      elapsed = t - start;
      return r;
    };
    const chain = composeInterceptors([log]);
    await chain(
      { service: 'S', method: 'M', metadata: [], request: {} },
      async () => ({ status: { code: 0, message: '' } }),
    );
    expect(elapsed).toBeGreaterThanOrEqual(10);
  });

  it('T-INT-G-009 cancel token = server-stream 内で cancel 検知して停止', async () => {
    const token = createCancelToken();
    const s = createGrpcServer({});
    s.addService(
      defineService('S', [
        { name: 's', type: 'server-stream', handler: async function* () {
          for (let i = 0; i < 100; i++) {
            if (token.isCanceled()) return;
            yield i;
            if (i === 4) token.cancel('client wants to stop');
          }
        } },
      ]),
    );
    const r = await invokeServerStream(s, 'S', 's', {});
    expect(r.responses.length).toBeLessThan(100);
    expect(token.isCanceled()).toBe(true);
    expect(token.reason()).toBe('client wants to stop');
  });

  it('T-INT-G-010 interceptor + deadline = 期限切れ interceptor が code=4 (DEADLINE_EXCEEDED) 返却', async () => {
    let t = 0;
    const ctx = createDeadlineContext(50, () => t);
    const deadlineIntc: Interceptor = async (_c, next) => {
      if (isDeadlineExceeded(ctx)) return { status: { code: STATUS_CODES.DEADLINE_EXCEEDED, message: 'timed out' } };
      return next();
    };
    const chain = composeInterceptors([deadlineIntc]);
    t = 100;
    const r = await chain(
      { service: 'S', method: 'M', metadata: [], request: {} },
      async () => ({ status: { code: 0, message: '' } }),
    );
    expect(r.status.code).toBe(STATUS_CODES.DEADLINE_EXCEEDED);
  });
});
