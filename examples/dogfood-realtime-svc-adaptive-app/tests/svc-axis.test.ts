import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('svc axis — mock adapter', () => {
  it.each(platforms)('%s: startSvcFlow assigns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSvcFlow({ platform, trackName: 'v-1' });
    expect(s.sessionId).toMatch(/^svc-\d+$/);
  });

  it('selectSvcLayer records layer + spatial + temporal', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSvcFlow({ platform: 'chromium', trackName: 'v-1' });
    const step = await adapter.selectSvcLayer(s, { layerId: 'high', temporalId: 2, spatialId: 1 });
    expect(step.metadata.layerId).toBe('high');
    expect(step.metadata.temporalId).toBe(2);
    expect(step.metadata.spatialId).toBe(1);
  });

  it('dropSvcLayer records reason', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSvcFlow({ platform: 'webkit', trackName: 'v-1' });
    const step = await adapter.dropSvcLayer(s, { layerId: 'low', reason: 'idle' });
    expect(step.metadata.reason).toBe('idle');
  });

  it('selectSvcLayer rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.selectSvcLayer({ sessionId: 'nope', platform: 'chromium', trackName: 't' }, { layerId: 'x', temporalId: 0, spatialId: 0 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeSvcFlow removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSvcFlow({ platform: 'firefox', trackName: 'v-1' });
    await adapter.closeSvcFlow(s);
    await expect(
      adapter.selectSvcLayer(s, { layerId: 'x', temporalId: 0, spatialId: 0 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('multiple layer selections track state', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSvcFlow({ platform: 'chromium', trackName: 'v-1' });
    for (const spatial of [0, 1, 2]) {
      const step = await adapter.selectSvcLayer(s, { layerId: 'x', temporalId: 2, spatialId: spatial });
      expect(step.metadata.spatialId).toBe(spatial);
    }
  });
});

describe('svc axis — real adapter env-gate', () => {
  it.each(platforms)('%s: selectSvcLayer reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startSvcFlow({ platform, trackName: 'v-1' });
    const step = await adapter.selectSvcLayer(s, { layerId: 'x', temporalId: 0, spatialId: 0 });
    expect(step.outcome).toBe('env-missing');
  });

  it('dropSvcLayer reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startSvcFlow({ platform: 'chromium', trackName: 'v-1' });
    const step = await adapter.dropSvcLayer(s, { layerId: 'x', reason: 'x' });
    expect(step.outcome).toBe('env-missing');
  });
});
