import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { EdgePlatform } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('warm axis — mock adapter', () => {
  it.each(platforms)('%s: startWarm assigns warm-prefixed session id', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWarm({ platform });
    expect(s.sessionId).toMatch(/^warm-\d+$/);
    expect(s.platform).toBe(platform);
  });

  it.each(platforms)('%s: preWarm records warmed event', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWarm({ platform });
    const step = await adapter.preWarm({ ...s, instanceId: 'fn-a', nowMs: 0 });
    expect(step.op).toBe('preWarm');
    expect(step.outcome).toBe('success');
    expect(step.metadata.neutralEvent).toBe('cold-start.warmed');
  });

  it('preWarm then invokeWarm returns warm class', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWarm({ platform: 'cloudflare' });
    await adapter.preWarm({ ...s, instanceId: 'fn-a', nowMs: 0 });
    const m = await adapter.invokeWarm({ ...s, instanceId: 'fn-a', nowMs: 1000 });
    expect(m.cls).toBe('warm');
    expect(m.latencyMs).toBe(30);
  });

  it('invokeWarm without preWarm returns cold class', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWarm({ platform: 'vercel' });
    const m = await adapter.invokeWarm({ ...s, instanceId: 'fn-a', nowMs: 0 });
    expect(m.cls).toBe('cold');
  });

  it('preWarm rejects unknown sessionId', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.preWarm({
        sessionId: 'nope',
        platform: 'cloudflare',
        startedAtMs: 0,
        instanceId: 'x',
        nowMs: 0,
      }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeWarm removes the session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWarm({ platform: 'deno' });
    await adapter.closeWarm(s);
    await expect(
      adapter.invokeWarm({ ...s, instanceId: 'x', nowMs: 0 }),
    ).rejects.toThrow(/unknown sessionId/);
  });
});

describe('warm axis — real adapter env-gate', () => {
  it.each(platforms)('%s: preWarm reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startWarm({ platform });
    const step = await adapter.preWarm({ ...s, instanceId: 'fn-a', nowMs: 0 });
    expect(step.outcome).toBe('env-missing');
    expect(step.metadata.reason).toBe('KIWA_EDGE_COLD_START_ENV_MISSING');
  });

  it('invokeWarm returns env-missing latency (-1)', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startWarm({ platform: 'cloudflare' });
    const m = await adapter.invokeWarm({ ...s, instanceId: 'fn-a', nowMs: 0 });
    expect(m.latencyMs).toBe(-1);
    expect(m.cls).toBe('warm');
  });
});
