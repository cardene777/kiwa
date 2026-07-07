import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { EdgePlatform } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('cold axis — mock adapter', () => {
  it.each(platforms)('%s: startCold assigns session id + platform', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startCold({ platform });
    expect(s.sessionId).toMatch(/^cold-\d+$/);
    expect(s.platform).toBe(platform);
  });

  it.each(platforms)('%s: invokeCold first time returns cold class + 250ms latency', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startCold({ platform });
    const m = await adapter.invokeCold({ ...s, instanceId: 'fn-a', nowMs: 0 });
    expect(m.cls).toBe('cold');
    expect(m.latencyMs).toBe(250);
    expect(m.instanceId).toBe('fn-a');
  });

  it('invokeCold second time within TTL returns warm class', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startCold({ platform: 'cloudflare' });
    await adapter.invokeCold({ ...s, instanceId: 'fn-a', nowMs: 0 });
    const m = await adapter.invokeCold({ ...s, instanceId: 'fn-a', nowMs: 1000 });
    expect(m.cls).toBe('warm');
    expect(m.latencyMs).toBe(30);
  });

  it('measureLatencyCold returns class-specific latency', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startCold({ platform: 'vercel' });
    expect(await adapter.measureLatencyCold({ ...s, cls: 'cold' })).toBe(250);
    expect(await adapter.measureLatencyCold({ ...s, cls: 'warm' })).toBe(30);
    expect(await adapter.measureLatencyCold({ ...s, cls: 'provisioned' })).toBe(5);
  });

  it('closeCold does not throw', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startCold({ platform: 'deno' });
    await expect(adapter.closeCold(s)).resolves.toBeUndefined();
  });

  it('invokeCold rejects unknown sessionId', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.invokeCold({
        sessionId: 'nope',
        platform: 'cloudflare',
        startedAtMs: 0,
        instanceId: 'x',
        nowMs: 0,
      }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('multiple sessions are independent', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startCold({ platform: 'cloudflare' });
    const s2 = await adapter.startCold({ platform: 'vercel' });
    expect(s1.sessionId).not.toBe(s2.sessionId);
    expect(s1.platform).toBe('cloudflare');
    expect(s2.platform).toBe('vercel');
  });
});

describe('cold axis — real adapter env-gate', () => {
  it.each(platforms)('%s: startCold returns session without env', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startCold({ platform });
    expect(s.sessionId).toMatch(/^cold-real-\d+$/);
  });

  it('invokeCold reports env-missing when env not ready', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startCold({ platform: 'cloudflare' });
    const m = await adapter.invokeCold({ ...s, instanceId: 'fn-a', nowMs: 0 });
    expect(m.latencyMs).toBe(-1);
    expect(m.instanceId).toBe('KIWA_EDGE_COLD_START_ENV_MISSING');
  });

  it('measureLatencyCold returns -1 without env', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startCold({ platform: 'vercel' });
    expect(await adapter.measureLatencyCold({ ...s, cls: 'cold' })).toBe(-1);
  });
});
