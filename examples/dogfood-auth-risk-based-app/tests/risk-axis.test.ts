import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

const LOW = {
  deviceScore: 5,
  ipReputation: 5,
  geoAnomaly: 5,
  velocityScore: 5,
  behavioralScore: 5,
};

const HIGH = {
  deviceScore: 20,
  ipReputation: 20,
  geoAnomaly: 20,
  velocityScore: 15,
  behavioralScore: 15,
};

describe('risk axis — mock adapter', () => {
  it.each(platforms)('%s: startRiskFlow assigns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRiskFlow({ platform, userId: 'u-1' });
    expect(s.sessionId).toMatch(/^risk-\d+$/);
  });

  it('low signals → allowed policy', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRiskFlow({ platform: 'chromium', userId: 'u-1' });
    await adapter.evaluateScoreOp(s, LOW);
    const step = await adapter.applyPolicyOp(s);
    expect(step.metadata.blocked).toBe(false);
    expect(step.metadata.neutralEvent).toBe('risk.policy-allowed');
  });

  it('high signals → blocked policy', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRiskFlow({ platform: 'webkit', userId: 'u-1' });
    await adapter.evaluateScoreOp(s, HIGH);
    const step = await adapter.applyPolicyOp(s);
    expect(step.metadata.blocked).toBe(true);
  });

  it('evaluateScoreOp records aggregate score', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRiskFlow({ platform: 'firefox', userId: 'u-1' });
    const step = await adapter.evaluateScoreOp(s, LOW);
    expect(step.metadata.score).toBe(25);
  });

  it('closeRisk removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRiskFlow({ platform: 'chromium', userId: 'u-1' });
    await adapter.closeRisk(s);
    await expect(adapter.evaluateScoreOp(s, LOW)).rejects.toThrow(/unknown sessionId/);
  });
});

describe('risk axis — real adapter env-gate', () => {
  it.each(platforms)('%s: evaluateScoreOp reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startRiskFlow({ platform, userId: 'u' });
    const step = await adapter.evaluateScoreOp(s, LOW);
    expect(step.outcome).toBe('env-missing');
  });

  it('applyPolicyOp records blocked=false in low signal case', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRiskFlow({ platform: 'chromium', userId: 'u' });
    await adapter.evaluateScoreOp(s, LOW);
    const step = await adapter.applyPolicyOp(s);
    expect(step.metadata.blocked).toBe(false);
  });

  it('evaluateScoreOp records aggregate for high signals', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startRiskFlow({ platform: 'firefox', userId: 'u' });
    const step = await adapter.evaluateScoreOp(s, HIGH);
    expect(step.metadata.score).toBe(90);
  });

  it('multiple risk sessions do not share state', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startRiskFlow({ platform: 'chromium', userId: 'u-A' });
    const s2 = await adapter.startRiskFlow({ platform: 'webkit', userId: 'u-B' });
    await adapter.evaluateScoreOp(s1, LOW);
    await adapter.evaluateScoreOp(s2, HIGH);
    const step1 = await adapter.applyPolicyOp(s1);
    const step2 = await adapter.applyPolicyOp(s2);
    expect(step1.metadata.blocked).toBe(false);
    expect(step2.metadata.blocked).toBe(true);
  });

  it('applyPolicyOp reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startRiskFlow({ platform: 'chromium', userId: 'u' });
    const step = await adapter.applyPolicyOp(s);
    expect(step.outcome).toBe('env-missing');
  });
});
