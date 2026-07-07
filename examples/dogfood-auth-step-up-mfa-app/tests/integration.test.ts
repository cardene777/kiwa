import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('integration — MFA cross-axis scenarios', () => {
  it.each(platforms)('%s: step-up → continuity → hijack chain', async (platform) => {
    const adapter = makeMockAdapter();
    const step = await adapter.startStepUpFlow({ platform, userId: 'u-1', currentAal: 'AAL1' });
    await adapter.escalateTo(step, { requiredAal: 'AAL3' });
    await adapter.satisfyFactor(step, { level: 'AAL3', factor: 'webauthn', nowMs: 100 });
    await adapter.closeStepUp(step);
    const cont = await adapter.startContinuityFlow({
      platform,
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 100_000,
    });
    await adapter.reauthSeamlessly(cont, { nowMs: 200 });
    const rot = await adapter.rotateRefreshToken(cont, { newToken: 'r-2', nowMs: 300 });
    expect(rot.metadata.newToken).toBe('r-2');
    await adapter.closeContinuity(cont);
    const hj = await adapter.startHijackWatchFlow({
      platform,
      userId: 'u-1',
      baselineFingerprint: 'fp-A',
      baselineRegion: 'JP',
    });
    const cascade = await adapter.cascadeLogout(hj, { revokedSessionIds: ['sess-a'] });
    expect(cascade.metadata.revokedCount).toBe(1);
  });

  it('concurrent step-up sessions are independent', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startStepUpFlow({ platform: 'chromium', userId: 'u-a', currentAal: 'AAL1' });
    const s2 = await adapter.startStepUpFlow({ platform: 'webkit', userId: 'u-b', currentAal: 'AAL1' });
    expect(s1.sessionId).not.toBe(s2.sessionId);
  });

  it('AAL3 satisfaction records passkey-biometric factor', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startStepUpFlow({ platform: 'firefox', userId: 'u-1', currentAal: 'AAL2' });
    await adapter.escalateTo(s, { requiredAal: 'AAL3' });
    const step = await adapter.satisfyFactor(s, {
      level: 'AAL3',
      factor: 'passkey-biometric',
      nowMs: 1000,
    });
    expect(step.metadata.factor).toBe('passkey-biometric');
  });

  it('refresh rotation preserves userId', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startContinuityFlow({
      platform: 'chromium',
      userId: 'u-42',
      refreshToken: 'r',
      expiresAtMs: 1000,
    });
    await adapter.rotateRefreshToken(s, { newToken: 'r-new', nowMs: 0 });
    expect(s.userId).toBe('u-42');
  });

  it('multiple drift + cascade sequence works', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startHijackWatchFlow({
      platform: 'webkit',
      userId: 'u-1',
      baselineFingerprint: 'fp-A',
      baselineRegion: 'JP',
    });
    await adapter.reportDrift(s, { observedFingerprint: 'fp-B', distance: 0.5 });
    await adapter.reportDrift(s, { observedFingerprint: 'fp-C', distance: 0.9 });
    const cascade = await adapter.cascadeLogout(s, { revokedSessionIds: ['a', 'b'] });
    expect(cascade.metadata.revokedCount).toBe(2);
  });

  it('AAL2 with totp factor works', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startStepUpFlow({ platform: 'chromium', userId: 'u-1', currentAal: 'AAL1' });
    await adapter.escalateTo(s, { requiredAal: 'AAL2' });
    const step = await adapter.satisfyFactor(s, { level: 'AAL2', factor: 'totp', nowMs: 500 });
    expect(step.metadata.factor).toBe('totp');
  });

  it('drift + cascade + close cycle is clean', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startHijackWatchFlow({
      platform: 'chromium',
      userId: 'u',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    await adapter.reportDrift(s, { observedFingerprint: 'x', distance: 0.5 });
    await adapter.cascadeLogout(s, { revokedSessionIds: [] });
    await adapter.closeHijackWatch(s);
    await expect(adapter.reportDrift(s, { observedFingerprint: 'y', distance: 0 })).rejects.toThrow(
      /unknown sessionId/,
    );
  });

  it('continuity + step-up in different sessions do not interfere', async () => {
    const adapter = makeMockAdapter();
    const cont = await adapter.startContinuityFlow({
      platform: 'chromium',
      userId: 'u-A',
      refreshToken: 'r-1',
      expiresAtMs: 10_000,
    });
    const step = await adapter.startStepUpFlow({
      platform: 'chromium',
      userId: 'u-B',
      currentAal: 'AAL1',
    });
    expect(cont.userId).not.toBe(step.userId);
  });

  it('close on one axis does not affect other axes', async () => {
    const adapter = makeMockAdapter();
    const step = await adapter.startStepUpFlow({ platform: 'chromium', userId: 'u', currentAal: 'AAL1' });
    const cont = await adapter.startContinuityFlow({
      platform: 'chromium',
      userId: 'u',
      refreshToken: 'r',
      expiresAtMs: 100,
    });
    await adapter.closeStepUp(step);
    const reauth = await adapter.reauthSeamlessly(cont, { nowMs: 0 });
    expect(reauth.outcome).toBe('success');
  });
});
