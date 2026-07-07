import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { EdgePlatform, Pop } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];
const POPS: Pop[] = [
  { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
  { popId: 'eu-1', region: 'eu', latencyMs: 50, healthy: true },
];

describe('anycast-routing axis — mock adapter', () => {
  it.each(platforms)('%s: startAnycast assigns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startAnycast({ platform, pops: POPS });
    expect(s.sessionId).toMatch(/^anycast-\d+$/);
    expect(s.platform).toBe(platform);
    expect(s.pops).toEqual(POPS);
  });

  it.each(platforms)('%s: receiveAnycastReq emits anycast-received event', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startAnycast({ platform, pops: POPS });
    const step = await adapter.receiveAnycastReq(s, { requestId: 'req-1' });
    expect(step.op).toBe('receiveAnycastReq');
    expect(step.metadata.neutralEvent).toBe('routing.anycast-received');
    expect(step.metadata.popCount).toBe(2);
  });

  it('markPopUnhealthy excludes POP from selection', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startAnycast({ platform: 'cloudflare', pops: POPS });
    const step = await adapter.markPopUnhealthy(s, { popId: 'us-1' });
    expect(step.op).toBe('markPopUnhealthy');
    expect(step.metadata.popId).toBe('us-1');
  });

  it('markPopUnhealthy rejects unknown popId', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startAnycast({ platform: 'vercel', pops: POPS });
    await expect(
      adapter.markPopUnhealthy(s, { popId: 'nope' }),
    ).rejects.toThrow(/unknown popId/);
  });

  it('closeAnycast removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startAnycast({ platform: 'deno', pops: POPS });
    await adapter.closeAnycast(s);
    await expect(
      adapter.receiveAnycastReq(s, { requestId: 'x' }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('concurrent sessions are independent', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startAnycast({ platform: 'cloudflare', pops: POPS });
    const s2 = await adapter.startAnycast({ platform: 'vercel', pops: POPS });
    expect(s1.sessionId).not.toBe(s2.sessionId);
  });
});

describe('anycast-routing axis — real adapter env-gate', () => {
  it.each(platforms)('%s: receiveAnycastReq reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startAnycast({ platform, pops: POPS });
    const step = await adapter.receiveAnycastReq(s, { requestId: 'req-1' });
    expect(step.outcome).toBe('env-missing');
  });

  it('markPopUnhealthy reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startAnycast({ platform: 'cloudflare', pops: POPS });
    const step = await adapter.markPopUnhealthy(s, { popId: 'us-1' });
    expect(step.outcome).toBe('env-missing');
  });
});
