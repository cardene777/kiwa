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
} from '../../src/index.js';

describe('grpc integration — 4 RPC patterns end-to-end', () => {
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
});
