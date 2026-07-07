import { describe, expect, it } from 'vitest';
import {
  bumpSchema,
  completeRollout,
  initiateMigration,
  migrateInstance,
  platformEventName,
  rollbackMigration,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('do-state-migration axis — 3 platform', () => {
  it.each(platforms)(
    '%s: initiate → bump → migrate 3 instances → rollout',
    (platform) => {
      const session = initiateMigration({
        platform,
        fromVersion: 1,
        toVersion: 2,
        instanceIds: ['do-a', 'do-b', 'do-c'],
      });
      expect(session.state).toBe('initiated');
      expect(session.history[0]!.neutralEvent).toBe('do-migration.initiated');
      expect(session.history[0]!.platformEvent).toBe(
        platformEventName(platform, 'do-migration.initiated'),
      );
      bumpSchema(session);
      expect(session.state).toBe('schema-bumped');
      migrateInstance(session, { instanceId: 'do-a' });
      migrateInstance(session, { instanceId: 'do-b' });
      migrateInstance(session, { instanceId: 'do-c' });
      const done = completeRollout(session);
      expect(done.state).toBe('rolled-out');
      expect(done.neutralEvent).toBe('do-migration.rolled-out');
      expect(done.metadata).toMatchObject({ toVersion: 2, migratedCount: 3 });
    },
  );

  it('rejects toVersion <= fromVersion', () => {
    expect(() =>
      initiateMigration({
        platform: 'cloudflare',
        fromVersion: 2,
        toVersion: 2,
        instanceIds: ['a'],
      }),
    ).toThrow(/must be >/);
    expect(() =>
      initiateMigration({
        platform: 'cloudflare',
        fromVersion: 2,
        toVersion: 1,
        instanceIds: ['a'],
      }),
    ).toThrow(/must be >/);
  });

  it('rejects bumpSchema unless initiated', () => {
    const session = initiateMigration({
      platform: 'vercel',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a'],
    });
    bumpSchema(session);
    expect(() => bumpSchema(session)).toThrow(/schema-bumped/);
  });

  it('rejects migrateInstance for unknown instance', () => {
    const session = initiateMigration({
      platform: 'deno',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a'],
    });
    bumpSchema(session);
    expect(() => migrateInstance(session, { instanceId: 'unknown' })).toThrow(
      /unknown instanceId/,
    );
  });

  it('rejects migrateInstance for already-migrated instance', () => {
    const session = initiateMigration({
      platform: 'cloudflare',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a'],
    });
    bumpSchema(session);
    migrateInstance(session, { instanceId: 'a' });
    expect(() => migrateInstance(session, { instanceId: 'a' })).toThrow(
      /already at toVersion/,
    );
  });

  it('rejects completeRollout when instances still on old version', () => {
    const session = initiateMigration({
      platform: 'vercel',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a', 'b'],
    });
    bumpSchema(session);
    migrateInstance(session, { instanceId: 'a' });
    expect(() => completeRollout(session)).toThrow(/still on old version/);
  });

  it('rollbackMigration resets every instance to fromVersion', () => {
    const session = initiateMigration({
      platform: 'deno',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a', 'b'],
    });
    bumpSchema(session);
    migrateInstance(session, { instanceId: 'a' });
    rollbackMigration(session);
    expect(session.state).toBe('rolled-back');
    expect(session.instances.get('a')).toBe(1);
    expect(session.migratedCount).toBe(0);
  });

  it('history accumulates every step in order', () => {
    const session = initiateMigration({
      platform: 'cloudflare',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a', 'b'],
    });
    bumpSchema(session);
    migrateInstance(session, { instanceId: 'a' });
    migrateInstance(session, { instanceId: 'b' });
    completeRollout(session);
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'do-migration.initiated',
      'do-migration.schema-bumped',
      'do-migration.data-migrated',
      'do-migration.data-migrated',
      'do-migration.rolled-out',
    ]);
  });

  it('metadata carries progress counters', () => {
    const session = initiateMigration({
      platform: 'vercel',
      fromVersion: 1,
      toVersion: 3,
      instanceIds: ['a', 'b', 'c', 'd'],
    });
    bumpSchema(session);
    migrateInstance(session, { instanceId: 'a' });
    const step = migrateInstance(session, { instanceId: 'b' });
    expect(step.metadata).toMatchObject({
      instanceId: 'b',
      fromVersion: 1,
      toVersion: 3,
      migratedCount: 2,
      totalCount: 4,
    });
  });
});
