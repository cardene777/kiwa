import { describe, expect, it } from 'vitest';
import {
  platformEventName,
  readFromReplica,
  reportLag,
  startD1,
  writeToPrimary,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('d1-read-replica axis — 3 platform', () => {
  it.each(platforms)('%s: write goes to primary', (platform) => {
    const session = startD1({ platform, primaryId: 'pg-primary' });
    const step = writeToPrimary(session, { query: 'INSERT INTO users' });
    expect(step.state).toBe('primary');
    expect(step.neutralEvent).toBe('d1.primary-write');
    expect(step.platformEvent).toBe(platformEventName(platform, 'd1.primary-write'));
  });

  it.each(platforms)('%s: read picks lowest-lag healthy replica in preferred region', (platform) => {
    const session = startD1({
      platform,
      primaryId: 'pg-primary',
      replicas: [
        { replicaId: 'r-us1', region: 'us', lagMs: 100 },
        { replicaId: 'r-us2', region: 'us', lagMs: 200 },
        { replicaId: 'r-eu1', region: 'eu', lagMs: 50 },
      ],
      maxLagMs: 500,
    });
    const step = readFromReplica(session, {
      query: 'SELECT * FROM users',
      preferredRegion: 'us',
    });
    expect(step.state).toBe('replica');
    expect(step.metadata).toMatchObject({ replicaId: 'r-us1', region: 'us', lagMs: 100 });
  });

  it('read falls back to any healthy replica when preferred region empty', () => {
    const session = startD1({
      platform: 'cloudflare',
      primaryId: 'pg-primary',
      replicas: [{ replicaId: 'r-eu1', region: 'eu', lagMs: 50 }],
    });
    const step = readFromReplica(session, {
      query: 'SELECT 1',
      preferredRegion: 'us',
    });
    expect(step.state).toBe('replica');
    expect(step.metadata.replicaId).toBe('r-eu1');
  });

  it('read failovers to primary when no healthy replicas', () => {
    const session = startD1({
      platform: 'vercel',
      primaryId: 'pg-primary',
      replicas: [{ replicaId: 'r-lagged', region: 'us', lagMs: 5000 }],
      maxLagMs: 500,
    });
    const step = readFromReplica(session, { query: 'SELECT 1' });
    expect(step.state).toBe('failing-over');
    expect(step.neutralEvent).toBe('d1.replica-failover');
    expect(step.metadata).toMatchObject({ fellBackTo: 'pg-primary', healthyCount: 0 });
  });

  it('reportLag flips replica to unhealthy when lag exceeds threshold', () => {
    const session = startD1({
      platform: 'deno',
      primaryId: 'pg-primary',
      replicas: [{ replicaId: 'r-1', region: 'us', lagMs: 100 }],
      maxLagMs: 500,
    });
    const step = reportLag(session, { replicaId: 'r-1', lagMs: 1000 });
    expect(step.state).toBe('lagged');
    expect(step.neutralEvent).toBe('d1.replica-lagged');
    expect(step.metadata).toMatchObject({ healthy: false, threshold: 500 });
  });

  it('reportLag flips replica back to healthy when lag drops', () => {
    const session = startD1({
      platform: 'cloudflare',
      primaryId: 'pg-primary',
      replicas: [{ replicaId: 'r-1', region: 'us', lagMs: 5000 }],
      maxLagMs: 500,
    });
    const step = reportLag(session, { replicaId: 'r-1', lagMs: 50 });
    expect(step.state).toBe('replica');
    expect(step.metadata.healthy).toBe(true);
  });

  it('rejects reportLag for unknown replica', () => {
    const session = startD1({ platform: 'vercel', primaryId: 'pg-primary' });
    expect(() => reportLag(session, { replicaId: 'unknown', lagMs: 100 })).toThrow(
      /unknown replicaId/,
    );
  });

  it('read picks lowest-lag when the first candidate is not the minimum', () => {
    const session = startD1({
      platform: 'cloudflare',
      primaryId: 'pg-primary',
      replicas: [
        { replicaId: 'r-us1', region: 'us', lagMs: 300 },
        { replicaId: 'r-us2', region: 'us', lagMs: 50 },
      ],
      maxLagMs: 500,
    });
    const step = readFromReplica(session, { query: 'SELECT 1', preferredRegion: 'us' });
    expect(step.metadata).toMatchObject({ replicaId: 'r-us2', lagMs: 50 });
  });

  it('defaults maxLagMs=500', () => {
    const session = startD1({ platform: 'deno', primaryId: 'pg-primary' });
    expect(session.maxLagMs).toBe(500);
  });

  it('history accumulates every step in order', () => {
    const session = startD1({
      platform: 'cloudflare',
      primaryId: 'pg',
      replicas: [{ replicaId: 'r', region: 'us', lagMs: 100 }],
    });
    writeToPrimary(session, { query: 'INSERT' });
    readFromReplica(session, { query: 'SELECT' });
    reportLag(session, { replicaId: 'r', lagMs: 2000 });
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'd1.primary-write',
      'd1.replica-read',
      'd1.replica-lagged',
    ]);
  });
});
