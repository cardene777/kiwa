import { describe, expect, it } from 'vitest';
import {
  createGrpcServer,
  defineService,
  invokeUnary,
  invokeServerStream,
  invokeClientStream,
  invokeBidi,
  createMetadata,
  mergeMetadata,
  encodeStatus,
  decodeStatus,
  STATUS_CODES,
} from '../../src/index.js';

describe('grpc skill assertions', () => {
  it('createGrpcServer が 4 provider (grpc-js/nice-grpc/twirp/connect) で instantiate 可能', () => {
    for (const provider of ['grpc-js', 'nice-grpc', 'twirp', 'connect'] as const) {
      const s = createGrpcServer({ provider });
      expect(s.provider).toBe(provider);
    }
  });

  it('defineService + addService で service registry に登録される', () => {
    const s = createGrpcServer({});
    s.addService(defineService('S', [{ name: 'm', type: 'unary', handler: () => 1 }]));
    expect(s.services.has('S')).toBe(true);
    expect(s.getMethod('S', 'm')?.type).toBe('unary');
  });

  it('4 RPC pattern (unary/server-stream/client-stream/bidi) が全て動作', async () => {
    const s = createGrpcServer({});
    s.addService(
      defineService('X', [
        { name: 'u', type: 'unary', handler: async () => ({ v: 1 }) },
        { name: 'ss', type: 'server-stream', handler: async function* () { yield 1; } },
        { name: 'cs', type: 'client-stream', handler: async (reqs: AsyncIterable<unknown>) => { let n = 0; for await (const _ of reqs) n++; return { n }; } },
        { name: 'bd', type: 'bidi', handler: async function* (reqs: AsyncIterable<unknown>) { for await (const _ of reqs) yield 'r'; } },
      ]),
    );
    expect((await invokeUnary(s, 'X', 'u', {})).ok).toBe(true);
    expect((await invokeServerStream(s, 'X', 'ss', {})).ok).toBe(true);
    expect((await invokeClientStream(s, 'X', 'cs', [{}, {}])).ok).toBe(true);
    expect((await invokeBidi(s, 'X', 'bd', [{}])).ok).toBe(true);
  });

  it('createMetadata / mergeMetadata が case-insensitive key で dedup', () => {
    const a = createMetadata({ Auth: 'a', 'X-Trace': 't' });
    const b = createMetadata({ auth: 'b' });
    const merged = mergeMetadata(a, b);
    expect(merged.find((e) => e.key === 'auth')?.value).toBe('b');
    expect(merged.length).toBe(2);
  });

  it('encodeStatus / decodeStatus が round-trip する', () => {
    const encoded = encodeStatus({ code: STATUS_CODES.NOT_FOUND, message: 'not found' });
    const decoded = decodeStatus(encoded);
    expect(decoded.code).toBe(STATUS_CODES.NOT_FOUND);
    expect(decoded.message).toBe('not found');
  });
});
