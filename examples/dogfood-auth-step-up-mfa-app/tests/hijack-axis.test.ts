import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('hijack axis — mock adapter', () => {
  it.each(platforms)('%s: reportDrift emits fingerprint-drift event', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startHijackWatchFlow({
      platform,
      userId: 'u-1',
      baselineFingerprint: 'fp-A',
      baselineRegion: 'JP',
    });
    const step = await adapter.reportDrift(s, { observedFingerprint: 'fp-B', distance: 0.8 });
    expect(step.metadata.neutralEvent).toBe('hijack.fingerprint-drift');
    expect(step.metadata.distance).toBe(0.8);
  });

  it('cascadeLogout emits logout-cascade event', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startHijackWatchFlow({
      platform: 'chromium',
      userId: 'u-1',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    const step = await adapter.cascadeLogout(s, { revokedSessionIds: ['s-a', 's-b', 's-c'] });
    expect(step.metadata.neutralEvent).toBe('hijack.logout-cascade');
    expect(step.metadata.revokedCount).toBe(3);
  });

  it('reportDrift rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.reportDrift(
        { sessionId: 'nope', platform: 'chromium', userId: 'u' },
        { observedFingerprint: 'x', distance: 0 },
      ),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeHijackWatch removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startHijackWatchFlow({
      platform: 'webkit',
      userId: 'u-1',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    await adapter.closeHijackWatch(s);
    await expect(
      adapter.reportDrift(s, { observedFingerprint: 'x', distance: 0 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('multiple drift reports supported per session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startHijackWatchFlow({
      platform: 'firefox',
      userId: 'u-1',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    await adapter.reportDrift(s, { observedFingerprint: 'fp-1', distance: 0.5 });
    const step2 = await adapter.reportDrift(s, { observedFingerprint: 'fp-2', distance: 0.9 });
    expect(step2.metadata.observedFingerprint).toBe('fp-2');
  });
});

describe('hijack axis — real adapter env-gate', () => {
  it.each(platforms)('%s: reportDrift reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startHijackWatchFlow({
      platform,
      userId: 'u',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    const step = await adapter.reportDrift(s, { observedFingerprint: 'x', distance: 0 });
    expect(step.outcome).toBe('env-missing');
  });

  it('sessionId prefix is hj- for hijack watch flow', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startHijackWatchFlow({
      platform: 'chromium',
      userId: 'u-1',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    expect(s.sessionId).toMatch(/^hj-\d+$/);
  });

  it('cascade with 0 revoked sessions is valid', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startHijackWatchFlow({
      platform: 'webkit',
      userId: 'u-1',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    const step = await adapter.cascadeLogout(s, { revokedSessionIds: [] });
    expect(step.metadata.revokedCount).toBe(0);
  });

  it('cascadeLogout reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startHijackWatchFlow({
      platform: 'chromium',
      userId: 'u',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    const step = await adapter.cascadeLogout(s, { revokedSessionIds: ['a'] });
    expect(step.outcome).toBe('env-missing');
  });
});
