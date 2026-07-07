import { describe, expect, it } from 'vitest';
import {
  checkTrustCache,
  platformEventName,
  requestEscalation,
  satisfyAal2,
  satisfyAal3,
  startStepUp,
  type AuthPlatform,
} from '../../src/semantics/index.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('step-up-mfa axis — 3 platform', () => {
  it.each(platforms)('%s: escalation AAL1 → AAL2', (platform) => {
    const s = startStepUp({ platform, userId: 'u-1', currentAal: 'AAL1' });
    const step = requestEscalation(s, { requiredAal: 'AAL2' });
    expect(step.state).toBe('escalation-requested');
    expect(step.platformEvent).toBe(platformEventName(platform, 'step-up.escalation-requested'));
  });

  it('satisfyAal2 fires with sms factor', () => {
    const s = startStepUp({ platform: 'chromium', userId: 'u-1', currentAal: 'AAL1' });
    requestEscalation(s, { requiredAal: 'AAL2' });
    const step = satisfyAal2(s, { factor: 'sms', nowMs: 1000 });
    expect(step.state).toBe('aal2-satisfied');
    expect(step.metadata.factor).toBe('sms');
  });

  it('satisfyAal3 fires with webauthn factor', () => {
    const s = startStepUp({ platform: 'webkit', userId: 'u-1', currentAal: 'AAL2' });
    requestEscalation(s, { requiredAal: 'AAL3' });
    const step = satisfyAal3(s, { factor: 'webauthn', nowMs: 2000 });
    expect(step.state).toBe('aal3-satisfied');
  });

  it('requestEscalation rejects same-level target', () => {
    const s = startStepUp({ platform: 'firefox', userId: 'u-1', currentAal: 'AAL2' });
    expect(() => requestEscalation(s, { requiredAal: 'AAL2' })).toThrow(/not higher/);
  });

  it('satisfyAal2 rejects when target is AAL3', () => {
    const s = startStepUp({ platform: 'chromium', userId: 'u-1', currentAal: 'AAL1' });
    requestEscalation(s, { requiredAal: 'AAL3' });
    expect(() => satisfyAal2(s, { factor: 'sms', nowMs: 0 })).toThrow(/AAL3/);
  });

  it('checkTrustCache hit within duration', () => {
    const s = startStepUp({
      platform: 'chromium',
      userId: 'u',
      currentAal: 'AAL1',
      trustDurationMs: 60_000,
    });
    requestEscalation(s, { requiredAal: 'AAL2' });
    satisfyAal2(s, { factor: 'totp', nowMs: 1000 });
    const step = checkTrustCache(s, { nowMs: 30_000 });
    expect(step.metadata.hit).toBe(true);
  });

  it('checkTrustCache miss after duration', () => {
    const s = startStepUp({
      platform: 'chromium',
      userId: 'u',
      currentAal: 'AAL1',
      trustDurationMs: 5000,
    });
    requestEscalation(s, { requiredAal: 'AAL2' });
    satisfyAal2(s, { factor: 'totp', nowMs: 0 });
    const step = checkTrustCache(s, { nowMs: 10_000 });
    expect(step.metadata.hit).toBe(false);
  });

  it('history accumulates in order', () => {
    const s = startStepUp({ platform: 'webkit', userId: 'u', currentAal: 'AAL1' });
    requestEscalation(s, { requiredAal: 'AAL3' });
    satisfyAal3(s, { factor: 'passkey-biometric', nowMs: 0 });
    checkTrustCache(s, { nowMs: 100 });
    expect(s.history.map((step) => step.neutralEvent)).toEqual([
      'step-up.escalation-requested',
      'step-up.aal3-satisfied',
      'step-up.trust-cached',
    ]);
  });

  it('default trustDurationMs is 900000', () => {
    const s = startStepUp({ platform: 'chromium', userId: 'u', currentAal: 'AAL1' });
    expect(s.trustDurationMs).toBe(900_000);
  });
});
