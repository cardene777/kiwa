import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('continuity axis — mock adapter', () => {
  it.each(platforms)('%s: reauthSeamlessly emits event', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startContinuityFlow({
      platform,
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 10_000,
    });
    const step = await adapter.reauthSeamlessly(s, { nowMs: 1000 });
    expect(step.metadata.neutralEvent).toBe('continuity.seamless-reauth');
  });

  it('rotateRefreshToken records new token', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startContinuityFlow({
      platform: 'chromium',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 10_000,
    });
    const step = await adapter.rotateRefreshToken(s, { newToken: 'r-2', nowMs: 500 });
    expect(step.metadata.newToken).toBe('r-2');
    expect(step.metadata.neutralEvent).toBe('continuity.refresh-rotated');
  });

  it('reauthSeamlessly rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.reauthSeamlessly({ sessionId: 'nope', platform: 'chromium', userId: 'u' }, { nowMs: 0 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeContinuity removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startContinuityFlow({
      platform: 'webkit',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 10_000,
    });
    await adapter.closeContinuity(s);
    await expect(adapter.reauthSeamlessly(s, { nowMs: 0 })).rejects.toThrow(/unknown sessionId/);
  });

  it('nowMs is preserved through reauth', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startContinuityFlow({
      platform: 'firefox',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 10_000,
    });
    const step = await adapter.reauthSeamlessly(s, { nowMs: 999 });
    expect(step.metadata.nowMs).toBe(999);
  });
});

describe('continuity axis — real adapter env-gate', () => {
  it.each(platforms)('%s: reauthSeamlessly reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startContinuityFlow({
      platform,
      userId: 'u',
      refreshToken: 'r',
      expiresAtMs: 1,
    });
    const step = await adapter.reauthSeamlessly(s, { nowMs: 0 });
    expect(step.outcome).toBe('env-missing');
  });

  it('sessionId prefix is cont- for continuity flow', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startContinuityFlow({
      platform: 'chromium',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 10_000,
    });
    expect(s.sessionId).toMatch(/^cont-\d+$/);
  });

  it('multiple rotations create distinct token trail', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startContinuityFlow({
      platform: 'firefox',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 10_000,
    });
    await adapter.rotateRefreshToken(s, { newToken: 'r-2', nowMs: 100 });
    const step = await adapter.rotateRefreshToken(s, { newToken: 'r-3', nowMs: 200 });
    expect(step.metadata.newToken).toBe('r-3');
  });

  it('rotateRefreshToken reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startContinuityFlow({
      platform: 'chromium',
      userId: 'u',
      refreshToken: 'r',
      expiresAtMs: 1,
    });
    const step = await adapter.rotateRefreshToken(s, { newToken: 'r-2', nowMs: 0 });
    expect(step.outcome).toBe('env-missing');
  });
});
