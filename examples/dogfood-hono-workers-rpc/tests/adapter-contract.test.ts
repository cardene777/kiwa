import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter, SkippedError } from '../src/adapters/real.js';

/**
 * Adapter contract tests — the 6-op surface, metrics rollup, trace
 * append + reset semantics on the mock, and the skip path on real.
 */
describe('hono adapter contract', () => {
  it('T-DHW-AC-001 mock adapter 6-op surface produces 6 ok trace entries', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveRoute('GET', '/health');
    await adapter.driveRpc('GET', '/health');
    await adapter.driveKv(1);
    await adapter.driveD1([{ id: 1, title: 'x' }]);
    await adapter.driveR2([{ key: 'k', contents: 'v' }]);
    await adapter.driveExecutionCtx(1);
    const okOps = adapter.traces().filter((t) => t.ok).map((t) => t.op);
    for (const op of [
      'driveRoute',
      'driveRpc',
      'driveKv',
      'driveD1',
      'driveR2',
      'driveExecutionCtx',
    ]) {
      expect(okOps).toContain(op);
    }
    await adapter.reset();
  });

  it('T-DHW-AC-002 metrics count ops per surface', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveRoute('GET', '/health');
    await adapter.driveRoute('GET', '/health');
    await adapter.driveRpc('GET', '/health');
    await adapter.driveKv(2);
    await adapter.driveD1([]);
    await adapter.driveR2([{ key: 'k', contents: 'v' }]);
    await adapter.driveExecutionCtx(1);
    const m = adapter.metrics();
    expect(m.routeInvokeCount).toBe(2);
    expect(m.rpcInvokeCount).toBe(1);
    expect(m.kvOpCount).toBe(1);
    expect(m.d1OpCount).toBe(1);
    expect(m.r2OpCount).toBe(1);
    expect(m.execCtxCount).toBe(1);
    // 7 ops = 7 latency samples.
    expect(m.latencySamplesMs.length).toBe(7);
    await adapter.reset();
  });

  it('T-DHW-AC-003 reset() clears trace + metrics + rebuilds bindings', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveRoute('GET', '/health');
    await adapter.driveKv(3);
    await adapter.reset();
    expect(adapter.traces().length).toBe(0);
    expect(adapter.metrics().latencySamplesMs.length).toBe(0);
    // After reset, KV should be empty again (new bindings instance).
    const kv2 = await adapter.driveKv(1);
    expect(kv2.reads.dogfood).toBe('1');
    await adapter.reset();
  });

  it('T-DHW-AC-004 real adapter throws SkippedError when CF_ACCOUNT_ID unset', async () => {
    const previous = process.env.CF_ACCOUNT_ID;
    delete process.env.CF_ACCOUNT_ID;
    try {
      const adapter = makeRealAdapter();
      await expect(adapter.driveRoute('GET', '/health')).rejects.toThrow(SkippedError);
      const trace = adapter.traces();
      const routeTrace = trace.find((t) => t.op === 'driveRoute');
      expect(routeTrace?.errorKind).toBe('HONO_REAL_ENV_MISSING');
    } finally {
      if (previous !== undefined) process.env.CF_ACCOUNT_ID = previous;
    }
  });

  it('T-DHW-AC-005 real adapter emits HONO_LIVE_NOT_IMPLEMENTED when env set', async () => {
    const previous = process.env.CF_ACCOUNT_ID;
    process.env.CF_ACCOUNT_ID = '1';
    try {
      const adapter = makeRealAdapter();
      await expect(adapter.driveRoute('GET', '/health')).rejects.toThrow(SkippedError);
      const trace = adapter.traces();
      const notImplemented = trace.find(
        (t) => t.op === 'driveRoute' && t.errorKind === 'HONO_LIVE_NOT_IMPLEMENTED',
      );
      expect(notImplemented).toBeDefined();
    } finally {
      if (previous !== undefined) process.env.CF_ACCOUNT_ID = previous;
      else delete process.env.CF_ACCOUNT_ID;
    }
  });
});
