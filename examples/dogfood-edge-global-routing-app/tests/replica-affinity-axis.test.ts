import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { EdgePlatform, Replica } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];
const REPLICAS: Replica[] = [
  { replicaId: 'r-us', region: 'us', lagMs: 100 },
  { replicaId: 'r-eu', region: 'eu', lagMs: 200 },
];

describe('replica-affinity axis — mock adapter', () => {
  it.each(platforms)('%s: startReplicaAffinity returns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startReplicaAffinity({
      platform,
      primaryId: 'pg-primary',
      replicas: REPLICAS,
    });
    expect(s.sessionId).toMatch(/^replica-\d+$/);
    expect(s.primaryId).toBe('pg-primary');
  });

  it.each(platforms)('%s: readFromClosestReplica picks in-region replica', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startReplicaAffinity({
      platform,
      primaryId: 'pg-primary',
      replicas: REPLICAS,
    });
    const step = await adapter.readFromClosestReplica(s, {
      query: 'SELECT 1',
      preferredRegion: 'us',
    });
    expect(step.metadata.neutralEvent).toBe('d1.replica-read');
    expect(step.metadata.state).toBe('replica');
  });

  it('readFromClosestReplica reports failover when all lagged', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startReplicaAffinity({
      platform: 'cloudflare',
      primaryId: 'pg-primary',
      replicas: [{ replicaId: 'r-1', region: 'us', lagMs: 5000 }],
    });
    const step = await adapter.readFromClosestReplica(s, { query: 'SELECT 1' });
    expect(step.metadata.state).toBe('failing-over');
  });

  it('reportReplicaLag flips replica unhealthy', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startReplicaAffinity({
      platform: 'vercel',
      primaryId: 'pg-primary',
      replicas: REPLICAS,
    });
    const step = await adapter.reportReplicaLag(s, { replicaId: 'r-us', lagMs: 1000 });
    expect(step.metadata.healthy).toBe(false);
  });

  it('reportReplicaLag rejects unknown replica', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startReplicaAffinity({
      platform: 'deno',
      primaryId: 'pg-primary',
      replicas: REPLICAS,
    });
    await expect(
      adapter.reportReplicaLag(s, { replicaId: 'nope', lagMs: 0 }),
    ).rejects.toThrow(/unknown replicaId/);
  });

  it('closeReplicaAffinity removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startReplicaAffinity({
      platform: 'cloudflare',
      primaryId: 'p',
      replicas: REPLICAS,
    });
    await adapter.closeReplicaAffinity(s);
    await expect(
      adapter.readFromClosestReplica(s, { query: 'x' }),
    ).rejects.toThrow(/unknown sessionId/);
  });
});

describe('replica-affinity axis — real adapter env-gate', () => {
  it('readFromClosestReplica reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startReplicaAffinity({
      platform: 'cloudflare',
      primaryId: 'p',
      replicas: REPLICAS,
    });
    const step = await adapter.readFromClosestReplica(s, { query: 'x' });
    expect(step.outcome).toBe('env-missing');
  });

  it('reportReplicaLag reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startReplicaAffinity({
      platform: 'vercel',
      primaryId: 'p',
      replicas: REPLICAS,
    });
    const step = await adapter.reportReplicaLag(s, { replicaId: 'r-us', lagMs: 100 });
    expect(step.outcome).toBe('env-missing');
  });
});
