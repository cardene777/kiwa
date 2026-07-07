import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { EdgePlatform } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];
const baseInput = { fromVersion: 1, toVersion: 2, instanceIds: ['do-a', 'do-b', 'do-c'] };

describe('data-migrate axis — mock adapter', () => {
  it.each(platforms)('%s: startDataMigrate begins with schema already bumped', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDataMigrate({ sessionId: '', platform, ...baseInput });
    expect(s.sessionId).toMatch(/^data-\d+$/);
  });

  it.each(platforms)('%s: migrateOneInstance increments migratedCount', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDataMigrate({ sessionId: '', platform, ...baseInput });
    const step = await adapter.migrateOneInstance(s, { instanceId: 'do-a' });
    expect(step.op).toBe('migrateOneInstance');
    expect(step.metadata.migratedCount).toBe(1);
  });

  it('migrateBatch migrates all provided instances', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDataMigrate({ sessionId: '', platform: 'cloudflare', ...baseInput });
    const step = await adapter.migrateBatch(s, { instanceIds: ['do-a', 'do-b', 'do-c'] });
    expect(step.metadata.migratedCount).toBe(3);
    expect(step.metadata.batchSize).toBe(3);
  });

  it('migrateBatch skips already-migrated instances gracefully', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDataMigrate({ sessionId: '', platform: 'vercel', ...baseInput });
    await adapter.migrateOneInstance(s, { instanceId: 'do-a' });
    const step = await adapter.migrateBatch(s, { instanceIds: ['do-a', 'do-b'] });
    expect(step.metadata.migratedCount).toBe(2);
  });

  it('migrateOneInstance rejects unknown instance', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDataMigrate({ sessionId: '', platform: 'deno', ...baseInput });
    await expect(
      adapter.migrateOneInstance(s, { instanceId: 'unknown' }),
    ).rejects.toThrow(/unknown instanceId/);
  });

  it('closeDataMigrate removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDataMigrate({ sessionId: '', platform: 'cloudflare', ...baseInput });
    await adapter.closeDataMigrate(s);
    await expect(
      adapter.migrateOneInstance(s, { instanceId: 'do-a' }),
    ).rejects.toThrow(/unknown sessionId/);
  });
});

describe('data-migrate axis — real adapter env-gate', () => {
  it('migrateOneInstance reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startDataMigrate({ sessionId: '', platform: 'cloudflare', ...baseInput });
    const step = await adapter.migrateOneInstance(s, { instanceId: 'do-a' });
    expect(step.outcome).toBe('env-missing');
  });

  it('migrateBatch reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startDataMigrate({ sessionId: '', platform: 'vercel', ...baseInput });
    const step = await adapter.migrateBatch(s, { instanceIds: ['do-a', 'do-b'] });
    expect(step.outcome).toBe('env-missing');
  });
});
