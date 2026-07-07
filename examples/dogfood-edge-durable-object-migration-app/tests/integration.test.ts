import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { EdgePlatform } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('integration — cross-axis migration flow', () => {
  it.each(platforms)('%s: full schema-bump → data-migrate → rollout flow', async (platform) => {
    const adapter = makeMockAdapter();
    const baseInput = { fromVersion: 1, toVersion: 2, instanceIds: ['do-a', 'do-b'] };
    const schemaBump = await adapter.startSchemaBump({ platform, ...baseInput });
    await adapter.bumpSchemaVersion(schemaBump);
    await adapter.verifySchemaBump(schemaBump);
    await adapter.closeSchemaBump(schemaBump);
    const dataMig = await adapter.startDataMigrate({
      sessionId: '',
      platform,
      ...baseInput,
    });
    await adapter.migrateBatch(dataMig, { instanceIds: baseInput.instanceIds });
    await adapter.closeDataMigrate(dataMig);
    const rollout = await adapter.startRollout({ sessionId: '', platform, ...baseInput });
    const done = await adapter.completeRolloutOp(rollout);
    expect(done.outcome).toBe('success');
    expect(done.metadata.toVersion).toBe(2);
  });

  it('rollout can be rolled back after completion', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRollout({
      sessionId: '',
      platform: 'cloudflare',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a'],
    });
    await adapter.completeRolloutOp(s);
    const step = await adapter.rollbackRollout(s);
    expect(step.metadata.fromVersion).toBe(1);
  });

  it('multi-version bump (1 → 5) supported', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRollout({
      sessionId: '',
      platform: 'vercel',
      fromVersion: 1,
      toVersion: 5,
      instanceIds: ['a', 'b', 'c'],
    });
    const step = await adapter.completeRolloutOp(s);
    expect(step.metadata.toVersion).toBe(5);
  });

  it('concurrent sessions independent', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startSchemaBump({
      platform: 'cloudflare',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a'],
    });
    const s2 = await adapter.startSchemaBump({
      platform: 'vercel',
      fromVersion: 1,
      toVersion: 3,
      instanceIds: ['b'],
    });
    await adapter.bumpSchemaVersion(s1);
    await adapter.bumpSchemaVersion(s2);
    expect((await adapter.verifySchemaBump(s1)).metadata.toVersion).toBe(2);
    expect((await adapter.verifySchemaBump(s2)).metadata.toVersion).toBe(3);
  });

  it('schema-bump verify reports migration state correctly', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSchemaBump({
      platform: 'cloudflare',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a'],
    });
    const before = await adapter.verifySchemaBump(s);
    expect(before.metadata.state).toBe('initiated');
    await adapter.bumpSchemaVersion(s);
    const after = await adapter.verifySchemaBump(s);
    expect(after.metadata.state).toBe('schema-bumped');
  });

  it('rollback after partial data-migrate resets state', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRollout({
      sessionId: '',
      platform: 'vercel',
      fromVersion: 5,
      toVersion: 10,
      instanceIds: ['a', 'b', 'c'],
    });
    const step = await adapter.rollbackRollout(s);
    expect(step.metadata.fromVersion).toBe(5);
  });

  it('close operations do not affect other sessions', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startSchemaBump({
      platform: 'cloudflare',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a'],
    });
    const s2 = await adapter.startSchemaBump({
      platform: 'vercel',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['b'],
    });
    await adapter.closeSchemaBump(s1);
    const step = await adapter.bumpSchemaVersion(s2);
    expect(step.outcome).toBe('success');
  });

  it('data-migrate migrateBatch is idempotent (already-migrated skipped)', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDataMigrate({
      sessionId: '',
      platform: 'deno',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a', 'b'],
    });
    const first = await adapter.migrateBatch(s, { instanceIds: ['a', 'b'] });
    expect(first.metadata.migratedCount).toBe(2);
    const again = await adapter.migrateBatch(s, { instanceIds: ['a', 'b'] });
    expect(again.metadata.batchSize).toBe(2);
    expect(again.outcome).toBe('success');
  });
});
