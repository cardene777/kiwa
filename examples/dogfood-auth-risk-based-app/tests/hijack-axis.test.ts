import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('hijack axis — mock adapter', () => {
  it.each(platforms)('%s: reportGeoAnomalyOp emits geo-anomaly', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConcurrentWatch({ platform, userId: 'u-1', baselineRegion: 'JP' });
    const step = await adapter.reportGeoAnomalyOp(s, {
      observedRegion: 'BR',
      km: 18_000,
      withinMinutes: 10,
    });
    expect(step.metadata.neutralEvent).toBe('hijack.geo-anomaly');
    expect(step.metadata.observedRegion).toBe('BR');
  });

  it('reportConcurrentOp records session count', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConcurrentWatch({
      platform: 'chromium',
      userId: 'u-1',
      baselineRegion: 'JP',
    });
    const step = await adapter.reportConcurrentOp(s, { concurrentSessionCount: 5 });
    expect(step.metadata.concurrentSessionCount).toBe(5);
    expect(step.metadata.neutralEvent).toBe('hijack.concurrent-session');
  });

  it('reportConcurrentOp rejects count <= 1', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConcurrentWatch({
      platform: 'webkit',
      userId: 'u-1',
      baselineRegion: 'JP',
    });
    await expect(adapter.reportConcurrentOp(s, { concurrentSessionCount: 1 })).rejects.toThrow(
      /must be > 1/,
    );
  });

  it('closeConcurrentWatch removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConcurrentWatch({
      platform: 'firefox',
      userId: 'u-1',
      baselineRegion: 'JP',
    });
    await adapter.closeConcurrentWatch(s);
    await expect(
      adapter.reportGeoAnomalyOp(s, { observedRegion: 'US', km: 0, withinMinutes: 0 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('sessionId prefix is conc- for concurrent watch flow', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConcurrentWatch({
      platform: 'chromium',
      userId: 'u-1',
      baselineRegion: 'JP',
    });
    expect(s.sessionId).toMatch(/^conc-\d+$/);
  });
});

describe('hijack axis — real adapter env-gate', () => {
  it.each(platforms)('%s: reportGeoAnomalyOp reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startConcurrentWatch({ platform, userId: 'u', baselineRegion: 'JP' });
    const step = await adapter.reportGeoAnomalyOp(s, {
      observedRegion: 'US',
      km: 0,
      withinMinutes: 0,
    });
    expect(step.outcome).toBe('env-missing');
  });

  it('geo anomaly km is preserved through reportGeoAnomalyOp', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConcurrentWatch({
      platform: 'chromium',
      userId: 'u-1',
      baselineRegion: 'JP',
    });
    const step = await adapter.reportGeoAnomalyOp(s, {
      observedRegion: 'FR',
      km: 9_000,
      withinMinutes: 3,
    });
    expect(step.metadata.km).toBe(9_000);
  });

  it('multiple concurrent reports supported per session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConcurrentWatch({
      platform: 'webkit',
      userId: 'u-1',
      baselineRegion: 'JP',
    });
    await adapter.reportConcurrentOp(s, { concurrentSessionCount: 2 });
    const step2 = await adapter.reportConcurrentOp(s, { concurrentSessionCount: 5 });
    expect(step2.metadata.concurrentSessionCount).toBe(5);
  });

  it('reportConcurrentOp reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startConcurrentWatch({
      platform: 'chromium',
      userId: 'u',
      baselineRegion: 'JP',
    });
    const step = await adapter.reportConcurrentOp(s, { concurrentSessionCount: 3 });
    expect(step.outcome).toBe('env-missing');
  });
});
