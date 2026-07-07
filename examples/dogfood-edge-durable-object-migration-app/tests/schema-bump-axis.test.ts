import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { EdgePlatform } from '../src/adapters/interface.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];
const baseInput = { fromVersion: 1, toVersion: 2, instanceIds: ['do-a', 'do-b'] };

describe('schema-bump axis — mock adapter', () => {
  it.each(platforms)('%s: startSchemaBump assigns session with version bounds', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSchemaBump({ platform, ...baseInput });
    expect(s.fromVersion).toBe(1);
    expect(s.toVersion).toBe(2);
    expect(s.instanceIds).toEqual(['do-a', 'do-b']);
    expect(s.sessionId).toMatch(/^schema-\d+$/);
  });

  it.each(platforms)('%s: bumpSchemaVersion emits schema-bumped event', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSchemaBump({ platform, ...baseInput });
    const step = await adapter.bumpSchemaVersion(s);
    expect(step.op).toBe('bumpSchemaVersion');
    expect(step.outcome).toBe('success');
    expect(step.metadata.neutralEvent).toBe('do-migration.schema-bumped');
  });

  it('verifySchemaBump reports schema-bumped state', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSchemaBump({ platform: 'cloudflare', ...baseInput });
    await adapter.bumpSchemaVersion(s);
    const step = await adapter.verifySchemaBump(s);
    expect(step.metadata.state).toBe('schema-bumped');
  });

  it('closeSchemaBump removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSchemaBump({ platform: 'vercel', ...baseInput });
    await adapter.closeSchemaBump(s);
    await expect(adapter.bumpSchemaVersion(s)).rejects.toThrow(/unknown sessionId/);
  });

  it('startSchemaBump rejects same-version bump', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.startSchemaBump({
        platform: 'deno',
        fromVersion: 2,
        toVersion: 2,
        instanceIds: ['a'],
      }),
    ).rejects.toThrow(/must be >/);
  });

  it('multiple concurrent sessions are isolated', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startSchemaBump({ platform: 'cloudflare', ...baseInput });
    const s2 = await adapter.startSchemaBump({ platform: 'vercel', ...baseInput });
    expect(s1.sessionId).not.toBe(s2.sessionId);
  });
});

describe('schema-bump axis — real adapter env-gate', () => {
  it.each(platforms)('%s: bumpSchemaVersion reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startSchemaBump({ platform, ...baseInput });
    const step = await adapter.bumpSchemaVersion(s);
    expect(step.outcome).toBe('env-missing');
  });

  it('verifySchemaBump reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startSchemaBump({ platform: 'cloudflare', ...baseInput });
    const step = await adapter.verifySchemaBump(s);
    expect(step.outcome).toBe('env-missing');
  });
});
