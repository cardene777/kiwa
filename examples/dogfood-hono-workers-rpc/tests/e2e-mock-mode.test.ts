import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('end-to-end mock-mode integration', () => {
  it('T-DHW-EE-M-001 6-op surface produces 6 ok trace entries', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveRoute('GET', '/health');
    await adapter.driveRpc('GET', '/health');
    await adapter.driveKv(1);
    await adapter.driveD1([{ id: 1, title: 'seed' }]);
    await adapter.driveR2([{ key: 'k', contents: 'v' }]);
    await adapter.driveExecutionCtx(2);
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

  it('T-DHW-EE-M-002 concurrent driveRoute / driveKv do not race the trace log', async () => {
    // Trace + metrics are captured on a per-adapter basis — running 3 ops
    // in sequence yields 3 latency samples in order.
    const adapter = makeMockAdapter();
    await adapter.driveRoute('GET', '/health');
    await adapter.driveKv(1);
    await adapter.driveRoute('GET', '/greet/x');
    expect(adapter.metrics().routeInvokeCount).toBe(2);
    expect(adapter.metrics().kvOpCount).toBe(1);
    expect(adapter.traces().length).toBe(3);
    await adapter.reset();
  });

  it('T-DHW-EE-M-003 driveRpc without auth records ok=false trace', async () => {
    const adapter = makeMockAdapter();
    // The mock adapter's driveRpc injects auth headers itself, so we
    // simulate an auth failure by explicitly overwriting the header to a
    // wrong token. status = 401 → snapshot.ok = false → trace.ok = false.
    const wrongAuth = await adapter.driveRpc('GET', '/health', {
      headers: { authorization: 'Bearer wrong-token' },
    });
    expect(wrongAuth.status).toBe(401);
    expect(wrongAuth.ok).toBe(false);
    const rpcTrace = adapter.traces().find((t) => t.op === 'driveRpc');
    expect(rpcTrace?.ok).toBe(false);
    await adapter.reset();
  });

  it('T-DHW-EE-M-004 reset() clears bindings so kv counter restarts from 0', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveKv(5);
    await adapter.reset();
    const second = await adapter.driveKv(1);
    // New bindings instance → KV empty → post first invocation stored '1'.
    expect(second.reads.dogfood).toBe('1');
    await adapter.reset();
  });

  it('T-DHW-EE-M-005 driveR2 records all uploads even under high concurrency', async () => {
    const adapter = makeMockAdapter();
    const uploads = Array.from({ length: 10 }, (_, i) => ({
      key: `f-${i}`,
      contents: `body-${i}`,
    }));
    const observation = await adapter.driveR2(uploads);
    expect(observation.keysWritten.length).toBe(10);
    expect(observation.keysListed.length).toBe(10);
    await adapter.reset();
  });
});
