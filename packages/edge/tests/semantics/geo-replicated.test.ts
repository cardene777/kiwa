import { describe, expect, it } from 'vitest';
import {
  createGeoReplicatedSession,
  geoPrimaryWrite,
  markReplicaLagged,
  platformEventName,
  resolveConflict,
  syncReplica,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

function make(platform: EdgePlatform) {
  return createGeoReplicatedSession({
    platform,
    primaryRegion: 'us-east-1',
    replicaRegions: ['eu-west-1', 'ap-south-1'],
  });
}

describe('geo-replicated axis — 3 platform', () => {
  it.each(platforms)('%s: write lags replicas, syncing all returns in-sync', (platform) => {
    const session = make(platform);
    expect(session.state).toBe('in-sync');

    const write = geoPrimaryWrite(session, { data: 'payload' });
    expect(write.state).toBe('lagging');
    expect(write.metadata.version).toBe(1);
    expect(session.lagMs['eu-west-1']).toBeGreaterThan(0);

    const first = syncReplica(session, { region: 'eu-west-1' });
    expect(first.metadata.allSynced).toBe(false);
    expect(session.state).toBe('lagging');

    const second = syncReplica(session, { region: 'ap-south-1' });
    expect(second.metadata.allSynced).toBe(true);
    expect(session.state).toBe('in-sync');
  });

  it.each(platforms)('%s: emits platform dialect for each neutral event', (platform) => {
    const session = make(platform);
    const write = geoPrimaryWrite(session, { data: 'x' });
    expect(write.platformEvent).toBe(platformEventName(platform, 'geo.primary-write'));
    const lagged = markReplicaLagged(session, { region: 'eu-west-1', lagMs: 250 });
    expect(lagged.platformEvent).toBe(platformEventName(platform, 'geo.replica-lagged'));
    const synced = syncReplica(session, { region: 'eu-west-1' });
    expect(synced.platformEvent).toBe(platformEventName(platform, 'geo.replica-synced'));
    const resolved = resolveConflict(session, { region: 'eu-west-1', chosenVersion: 1 });
    expect(resolved.platformEvent).toBe(platformEventName(platform, 'geo.conflict-resolved'));
  });

  it('primary write bumps version each call', () => {
    const session = make('cloudflare');
    expect(geoPrimaryWrite(session, { data: 'a' }).metadata.version).toBe(1);
    expect(geoPrimaryWrite(session, { data: 'bb' }).metadata.version).toBe(2);
  });

  it('markReplicaLagged records lag + rejects unknown region', () => {
    const session = make('deno');
    const step = markReplicaLagged(session, { region: 'ap-south-1', lagMs: 500 });
    expect(step.metadata.region).toBe('ap-south-1');
    expect(step.metadata.lagMs).toBe(500);
    expect(session.lagMs['ap-south-1']).toBe(500);
    expect(() => markReplicaLagged(session, { region: 'nowhere', lagMs: 1 })).toThrow(
      /not a replica region/,
    );
  });

  it('syncReplica rejects unknown region', () => {
    const session = make('vercel');
    expect(() => syncReplica(session, { region: 'nowhere' })).toThrow(/not a replica region/);
  });

  it('resolveConflict adopts version, clears lag, forces in-sync', () => {
    const session = make('cloudflare');
    geoPrimaryWrite(session, { data: 'x' });
    session.state = 'conflict-detected';
    expect(session.lagMs['eu-west-1']).toBeGreaterThan(0);
    const step = resolveConflict(session, { region: 'eu-west-1', chosenVersion: 7 });
    expect(step.state).toBe('in-sync');
    expect(step.metadata.chosenVersion).toBe(7);
    expect(session.state).toBe('in-sync');
    expect(session.version).toBe(7);
    expect(session.lagMs['eu-west-1']).toBe(0);
    expect(session.lagMs['ap-south-1']).toBe(0);
  });

  it('resolveConflict rejects unknown region', () => {
    const session = make('vercel');
    expect(() => resolveConflict(session, { region: 'nowhere', chosenVersion: 1 })).toThrow(
      /not a replica region/,
    );
  });

  it('history accumulates one step per operation', () => {
    const session = make('deno');
    geoPrimaryWrite(session, { data: 'x' });
    markReplicaLagged(session, { region: 'eu-west-1', lagMs: 100 });
    syncReplica(session, { region: 'eu-west-1' });
    syncReplica(session, { region: 'ap-south-1' });
    resolveConflict(session, { region: 'eu-west-1', chosenVersion: 1 });
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'geo.primary-write',
      'geo.replica-lagged',
      'geo.replica-synced',
      'geo.replica-synced',
      'geo.conflict-resolved',
    ]);
  });
});
