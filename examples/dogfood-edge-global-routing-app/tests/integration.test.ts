import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { EdgePlatform, Pop, Replica } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('integration — routing cross-axis scenarios', () => {
  it.each(platforms)('%s: full anycast → geo → replica flow', async (platform) => {
    const adapter = makeMockAdapter();
    const pops: Pop[] = [
      { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
      { popId: 'eu-1', region: 'eu', latencyMs: 50, healthy: true },
    ];
    const anycast = await adapter.startAnycast({ platform, pops });
    await adapter.receiveAnycastReq(anycast, { requestId: 'req-1' });
    await adapter.closeAnycast(anycast);
    const geo = await adapter.startGeoMatching({ platform, pops });
    await adapter.matchGeoRegion(geo, { requestId: 'req-1', region: 'us' });
    const picked = await adapter.selectLowestLatency(geo, {
      requestId: 'req-1',
      preferredRegion: 'us',
    });
    expect(picked.metadata.popId).toBe('us-1');
    await adapter.closeGeoMatching(geo);
    const replicas: Replica[] = [
      { replicaId: 'r-us', region: 'us', lagMs: 100 },
    ];
    const replica = await adapter.startReplicaAffinity({
      platform,
      primaryId: 'pg',
      replicas,
    });
    const read = await adapter.readFromClosestReplica(replica, {
      query: 'SELECT 1',
      preferredRegion: 'us',
    });
    expect(read.metadata.state).toBe('replica');
  });

  it('markPopUnhealthy then selectLowestLatency skips the unhealthy pop', async () => {
    const adapter = makeMockAdapter();
    const pops: Pop[] = [
      { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
      { popId: 'us-2', region: 'us', latencyMs: 50, healthy: true },
    ];
    const s = await adapter.startAnycast({ platform: 'cloudflare', pops });
    await adapter.markPopUnhealthy(s, { popId: 'us-1' });
    const picked = await adapter.selectLowestLatency(s, { requestId: 'r', preferredRegion: 'us' });
    expect(picked.metadata.popId).toBe('us-2');
  });

  it('reportReplicaLag then readFromClosestReplica reroutes to healthy replica', async () => {
    const adapter = makeMockAdapter();
    const replicas: Replica[] = [
      { replicaId: 'r-us', region: 'us', lagMs: 100 },
      { replicaId: 'r-eu', region: 'eu', lagMs: 100 },
    ];
    const s = await adapter.startReplicaAffinity({
      platform: 'vercel',
      primaryId: 'pg',
      replicas,
    });
    await adapter.reportReplicaLag(s, { replicaId: 'r-us', lagMs: 5000 });
    const read = await adapter.readFromClosestReplica(s, {
      query: 'SELECT 1',
      preferredRegion: 'us',
    });
    expect(read.metadata.state).toBe('replica'); // fell back to eu
  });

  it('geo match count monotonically increases with wider pops', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startGeoMatching({
      platform: 'deno',
      pops: [{ popId: 'us-1', region: 'us', latencyMs: 30, healthy: true }],
    });
    const s2 = await adapter.startGeoMatching({
      platform: 'deno',
      pops: [
        { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'us-2', region: 'us', latencyMs: 50, healthy: true },
        { popId: 'us-3', region: 'us', latencyMs: 70, healthy: true },
      ],
    });
    const m1 = await adapter.matchGeoRegion(s1, { requestId: 'r', region: 'us' });
    const m2 = await adapter.matchGeoRegion(s2, { requestId: 'r', region: 'us' });
    expect(m1.metadata.matchedCount).toBe(1);
    expect(m2.metadata.matchedCount).toBe(3);
  });

  it('sequential geo-match then latency-select forms complete routing decision', async () => {
    const adapter = makeMockAdapter();
    const pops: Pop[] = [
      { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
      { popId: 'us-2', region: 'us', latencyMs: 40, healthy: true },
    ];
    const s = await adapter.startGeoMatching({ platform: 'cloudflare', pops });
    const match = await adapter.matchGeoRegion(s, { requestId: 'r', region: 'us' });
    const pick = await adapter.selectLowestLatency(s, { requestId: 'r', preferredRegion: 'us' });
    expect(match.metadata.matchedCount).toBe(2);
    expect(pick.metadata.popId).toBe('us-1');
  });

  it('multiple concurrent requests share routing session', async () => {
    const adapter = makeMockAdapter();
    const pops: Pop[] = [{ popId: 'us-1', region: 'us', latencyMs: 30, healthy: true }];
    const s = await adapter.startAnycast({ platform: 'vercel', pops });
    const results = await Promise.all([
      adapter.receiveAnycastReq(s, { requestId: 'r-1' }),
      adapter.receiveAnycastReq(s, { requestId: 'r-2' }),
      adapter.receiveAnycastReq(s, { requestId: 'r-3' }),
    ]);
    for (const r of results) {
      expect(r.outcome).toBe('success');
    }
  });

  it('replica returned to healthy state on subsequent lag decrease', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startReplicaAffinity({
      platform: 'deno',
      primaryId: 'pg',
      replicas: [{ replicaId: 'r-1', region: 'us', lagMs: 100 }],
    });
    await adapter.reportReplicaLag(s, { replicaId: 'r-1', lagMs: 1000 });
    const back = await adapter.reportReplicaLag(s, { replicaId: 'r-1', lagMs: 50 });
    expect(back.metadata.healthy).toBe(true);
  });

  it('close does not affect other sessions', async () => {
    const adapter = makeMockAdapter();
    const pops: Pop[] = [{ popId: 'us-1', region: 'us', latencyMs: 30, healthy: true }];
    const s1 = await adapter.startAnycast({ platform: 'cloudflare', pops });
    const s2 = await adapter.startAnycast({ platform: 'vercel', pops });
    await adapter.closeAnycast(s1);
    const step = await adapter.receiveAnycastReq(s2, { requestId: 'r' });
    expect(step.outcome).toBe('success');
  });
});
