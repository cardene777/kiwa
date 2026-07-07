import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { EdgePlatform, Pop } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];
const POPS: Pop[] = [
  { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
  { popId: 'us-2', region: 'us', latencyMs: 50, healthy: true },
  { popId: 'eu-1', region: 'eu', latencyMs: 100, healthy: true },
];

describe('geo-matching axis — mock adapter', () => {
  it.each(platforms)('%s: startGeoMatching returns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startGeoMatching({ platform, pops: POPS });
    expect(s.sessionId).toMatch(/^geo-\d+$/);
  });

  it.each(platforms)('%s: matchGeoRegion reports matched count', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startGeoMatching({ platform, pops: POPS });
    const step = await adapter.matchGeoRegion(s, { requestId: 'r', region: 'us' });
    expect(step.metadata.matchedCount).toBe(2);
    expect(step.metadata.neutralEvent).toBe('routing.geo-matched');
  });

  it('matchGeoRegion returns 0 when region empty', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startGeoMatching({ platform: 'cloudflare', pops: POPS });
    const step = await adapter.matchGeoRegion(s, { requestId: 'r', region: 'ap' });
    expect(step.metadata.matchedCount).toBe(0);
  });

  it('selectLowestLatency picks in-region pop first', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startGeoMatching({ platform: 'vercel', pops: POPS });
    const step = await adapter.selectLowestLatency(s, { requestId: 'r', preferredRegion: 'us' });
    expect(step.metadata.popId).toBe('us-1');
    expect(step.metadata.neutralEvent).toBe('routing.latency-selected');
  });

  it('selectLowestLatency falls back across regions if preferred empty', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startGeoMatching({ platform: 'deno', pops: POPS });
    const step = await adapter.selectLowestLatency(s, { requestId: 'r', preferredRegion: 'ap' });
    expect(step.metadata.neutralEvent).toBe('routing.failover-triggered');
  });

  it('closeGeoMatching removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startGeoMatching({ platform: 'cloudflare', pops: POPS });
    await adapter.closeGeoMatching(s);
    await expect(
      adapter.matchGeoRegion(s, { requestId: 'x', region: 'us' }),
    ).rejects.toThrow(/unknown sessionId/);
  });
});

describe('geo-matching axis — real adapter env-gate', () => {
  it.each(platforms)('%s: matchGeoRegion reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startGeoMatching({ platform, pops: POPS });
    const step = await adapter.matchGeoRegion(s, { requestId: 'r', region: 'us' });
    expect(step.outcome).toBe('env-missing');
  });

  it('selectLowestLatency reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startGeoMatching({ platform: 'cloudflare', pops: POPS });
    const step = await adapter.selectLowestLatency(s, { requestId: 'r' });
    expect(step.outcome).toBe('env-missing');
  });
});
