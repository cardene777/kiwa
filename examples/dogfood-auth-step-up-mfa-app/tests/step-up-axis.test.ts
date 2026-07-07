import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('step-up axis — mock adapter', () => {
  it.each(platforms)('%s: startStepUpFlow + escalate AAL1→AAL2', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startStepUpFlow({ platform, userId: 'u-1', currentAal: 'AAL1' });
    const step = await adapter.escalateTo(s, { requiredAal: 'AAL2' });
    expect(step.metadata.neutralEvent).toBe('step-up.escalation-requested');
    expect(step.metadata.requiredAal).toBe('AAL2');
  });

  it('satisfyFactor AAL2 with sms', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startStepUpFlow({
      platform: 'chromium',
      userId: 'u-1',
      currentAal: 'AAL1',
    });
    await adapter.escalateTo(s, { requiredAal: 'AAL2' });
    const step = await adapter.satisfyFactor(s, { level: 'AAL2', factor: 'sms', nowMs: 1000 });
    expect(step.metadata.neutralEvent).toBe('step-up.aal2-satisfied');
  });

  it('satisfyFactor AAL3 with passkey-biometric', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startStepUpFlow({
      platform: 'webkit',
      userId: 'u-1',
      currentAal: 'AAL1',
    });
    await adapter.escalateTo(s, { requiredAal: 'AAL3' });
    const step = await adapter.satisfyFactor(s, {
      level: 'AAL3',
      factor: 'passkey-biometric',
      nowMs: 2000,
    });
    expect(step.metadata.neutralEvent).toBe('step-up.aal3-satisfied');
  });

  it('escalateTo rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.escalateTo({ sessionId: 'nope', platform: 'chromium', userId: 'u' }, { requiredAal: 'AAL2' }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeStepUp removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startStepUpFlow({
      platform: 'firefox',
      userId: 'u-1',
      currentAal: 'AAL1',
    });
    await adapter.closeStepUp(s);
    await expect(adapter.escalateTo(s, { requiredAal: 'AAL2' })).rejects.toThrow(/unknown sessionId/);
  });
});

describe('step-up axis — real adapter env-gate', () => {
  it.each(platforms)('%s: escalateTo reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startStepUpFlow({ platform, userId: 'u', currentAal: 'AAL1' });
    const step = await adapter.escalateTo(s, { requiredAal: 'AAL2' });
    expect(step.outcome).toBe('env-missing');
  });

  it('sessionId prefix is step- for step-up flow', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startStepUpFlow({
      platform: 'chromium',
      userId: 'u-1',
      currentAal: 'AAL1',
    });
    expect(s.sessionId).toMatch(/^step-\d+$/);
  });

  it('escalation to AAL3 from AAL2 works', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startStepUpFlow({
      platform: 'webkit',
      userId: 'u-1',
      currentAal: 'AAL2',
    });
    const step = await adapter.escalateTo(s, { requiredAal: 'AAL3' });
    expect(step.metadata.requiredAal).toBe('AAL3');
  });

  it('satisfyFactor reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startStepUpFlow({
      platform: 'chromium',
      userId: 'u',
      currentAal: 'AAL1',
    });
    const step = await adapter.satisfyFactor(s, { level: 'AAL2', factor: 'sms', nowMs: 0 });
    expect(step.outcome).toBe('env-missing');
  });
});
