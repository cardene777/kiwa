import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { EdgePlatform } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('integration — cross-axis scenarios', () => {
  it.each(platforms)('%s: cold → provisioned upgrade recovers baseline latency', async (platform) => {
    const adapter = makeMockAdapter();
    const cold = await adapter.startCold({ platform });
    const m1 = await adapter.invokeCold({ ...cold, instanceId: 'fn-x', nowMs: 0 });
    expect(m1.cls).toBe('cold');
    expect(m1.latencyMs).toBe(250);
    await adapter.closeCold(cold);
    const prov = await adapter.startProvisioned({ platform });
    await adapter.reserveProvisioned({ ...prov, instanceIds: ['fn-x'] });
    const m2 = await adapter.invokeProvisioned({ ...prov, instanceId: 'fn-x', nowMs: 1000 });
    expect(m2.cls).toBe('provisioned');
    expect(m2.latencyMs).toBe(5);
  });

  it.each(platforms)('%s: warm pool amortises cold penalty across invocations', async (platform) => {
    const adapter = makeMockAdapter();
    const warm = await adapter.startWarm({ platform });
    await adapter.preWarm({ ...warm, instanceId: 'fn-y', nowMs: 0 });
    const m1 = await adapter.invokeWarm({ ...warm, instanceId: 'fn-y', nowMs: 100 });
    const m2 = await adapter.invokeWarm({ ...warm, instanceId: 'fn-y', nowMs: 200 });
    const m3 = await adapter.invokeWarm({ ...warm, instanceId: 'fn-y', nowMs: 300 });
    expect([m1.cls, m2.cls, m3.cls]).toEqual(['warm', 'warm', 'warm']);
    const totalLatency = m1.latencyMs + m2.latencyMs + m3.latencyMs;
    expect(totalLatency).toBe(90); // 30ms × 3
  });

  it('provisioned pool serves multiple instance ids independently', async () => {
    const adapter = makeMockAdapter();
    const prov = await adapter.startProvisioned({ platform: 'cloudflare' });
    await adapter.reserveProvisioned({
      ...prov,
      instanceIds: ['fn-a', 'fn-b', 'fn-c'],
    });
    const results = await Promise.all([
      adapter.invokeProvisioned({ ...prov, instanceId: 'fn-a', nowMs: 0 }),
      adapter.invokeProvisioned({ ...prov, instanceId: 'fn-b', nowMs: 0 }),
      adapter.invokeProvisioned({ ...prov, instanceId: 'fn-c', nowMs: 0 }),
    ]);
    for (const m of results) {
      expect(m.cls).toBe('provisioned');
    }
  });

  it('invocations across sessions are isolated', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startCold({ platform: 'cloudflare' });
    const s2 = await adapter.startCold({ platform: 'vercel' });
    await adapter.invokeCold({ ...s1, instanceId: 'fn-a', nowMs: 0 });
    const m2 = await adapter.invokeCold({ ...s2, instanceId: 'fn-a', nowMs: 1 });
    expect(m2.cls).toBe('cold');
  });

  it('provisioned outperforms warm outperforms cold', async () => {
    const adapter = makeMockAdapter();
    const cold = await adapter.startCold({ platform: 'deno' });
    const warm = await adapter.startWarm({ platform: 'deno' });
    const prov = await adapter.startProvisioned({ platform: 'deno' });
    const mc = await adapter.invokeCold({ ...cold, instanceId: 'fn', nowMs: 0 });
    await adapter.preWarm({ ...warm, instanceId: 'fn', nowMs: 0 });
    const mw = await adapter.invokeWarm({ ...warm, instanceId: 'fn', nowMs: 1000 });
    await adapter.reserveProvisioned({ ...prov, instanceIds: ['fn'] });
    const mp = await adapter.invokeProvisioned({ ...prov, instanceId: 'fn', nowMs: 0 });
    expect(mp.latencyMs).toBeLessThan(mw.latencyMs);
    expect(mw.latencyMs).toBeLessThan(mc.latencyMs);
  });

  it('close does not affect other sessions', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startCold({ platform: 'cloudflare' });
    const s2 = await adapter.startCold({ platform: 'vercel' });
    await adapter.closeCold(s1);
    const m = await adapter.invokeCold({ ...s2, instanceId: 'fn', nowMs: 0 });
    expect(m.cls).toBe('cold');
  });
});
