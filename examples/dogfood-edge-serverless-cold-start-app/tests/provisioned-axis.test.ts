import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { EdgePlatform } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('provisioned axis — mock adapter', () => {
  it.each(platforms)('%s: startProvisioned assigns prov session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startProvisioned({ platform });
    expect(s.sessionId).toMatch(/^prov-\d+$/);
    expect(s.platform).toBe(platform);
  });

  it('reserveProvisioned records count', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startProvisioned({ platform: 'cloudflare' });
    const step = await adapter.reserveProvisioned({
      ...s,
      instanceIds: ['a', 'b', 'c'],
    });
    expect(step.op).toBe('reserveProvisioned');
    expect(step.outcome).toBe('success');
    expect(step.metadata.reservedCount).toBe(3);
  });

  it.each(platforms)('%s: invokeProvisioned returns provisioned class after reservation', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startProvisioned({ platform });
    await adapter.reserveProvisioned({ ...s, instanceIds: ['always-on'] });
    const m = await adapter.invokeProvisioned({ ...s, instanceId: 'always-on', nowMs: 0 });
    expect(m.cls).toBe('provisioned');
    expect(m.latencyMs).toBe(5);
  });

  it('invokeProvisioned without reservation returns cold class', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startProvisioned({ platform: 'vercel' });
    const m = await adapter.invokeProvisioned({ ...s, instanceId: 'no-reserve', nowMs: 0 });
    expect(m.cls).toBe('cold');
  });

  it('closeProvisioned removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startProvisioned({ platform: 'deno' });
    await adapter.closeProvisioned(s);
    await expect(
      adapter.invokeProvisioned({ ...s, instanceId: 'x', nowMs: 0 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('provisioned invocations bypass warm TTL eviction', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startProvisioned({ platform: 'cloudflare' });
    await adapter.reserveProvisioned({ ...s, instanceIds: ['always-on'] });
    const m1 = await adapter.invokeProvisioned({ ...s, instanceId: 'always-on', nowMs: 0 });
    const m2 = await adapter.invokeProvisioned({
      ...s,
      instanceId: 'always-on',
      nowMs: 999_999_999,
    });
    expect(m1.cls).toBe('provisioned');
    expect(m2.cls).toBe('provisioned');
  });
});

describe('provisioned axis — real adapter env-gate', () => {
  it('reserveProvisioned reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startProvisioned({ platform: 'cloudflare' });
    const step = await adapter.reserveProvisioned({ ...s, instanceIds: ['a'] });
    expect(step.outcome).toBe('env-missing');
  });

  it.each(platforms)('%s: invokeProvisioned returns env-missing latency', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startProvisioned({ platform });
    const m = await adapter.invokeProvisioned({ ...s, instanceId: 'x', nowMs: 0 });
    expect(m.latencyMs).toBe(-1);
    expect(m.cls).toBe('provisioned');
  });
});
