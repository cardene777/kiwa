import { describe, expect, it } from 'vitest';
import {
  applyPolicy,
  evaluateScore,
  injectChallenge,
  platformEventName,
  startRiskEval,
  type AuthPlatform,
} from '../../src/semantics/index.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

const lowSignals = {
  deviceScore: 5,
  ipReputation: 5,
  geoAnomaly: 5,
  velocityScore: 5,
  behavioralScore: 5,
};

const midSignals = {
  deviceScore: 10,
  ipReputation: 10,
  geoAnomaly: 10,
  velocityScore: 10,
  behavioralScore: 10,
};

const highSignals = {
  deviceScore: 20,
  ipReputation: 20,
  geoAnomaly: 20,
  velocityScore: 15,
  behavioralScore: 15,
};

describe('risk-based-auth axis — 3 platform', () => {
  it.each(platforms)('%s: evaluateScore records aggregate', (platform) => {
    const s = startRiskEval({ platform, userId: 'u-1' });
    const step = evaluateScore(s, { signals: lowSignals });
    expect(step.state).toBe('evaluated');
    expect(step.metadata.score).toBe(25);
    expect(step.platformEvent).toBe(platformEventName(platform, 'risk.score-evaluated'));
  });

  it('low score → allowed policy', () => {
    const s = startRiskEval({ platform: 'chromium', userId: 'u-1' });
    evaluateScore(s, { signals: lowSignals });
    const step = applyPolicy(s);
    expect(step.state).toBe('allowed');
    expect(step.neutralEvent).toBe('risk.policy-allowed');
  });

  it('mid score → challenge injected', () => {
    const s = startRiskEval({ platform: 'webkit', userId: 'u-1' });
    evaluateScore(s, { signals: midSignals });
    const step = injectChallenge(s, { challenge: 'webauthn' });
    expect(step.state).toBe('challenged');
    expect(step.metadata.challenge).toBe('webauthn');
  });

  it('high score → blocked policy', () => {
    const s = startRiskEval({ platform: 'firefox', userId: 'u-1' });
    evaluateScore(s, { signals: highSignals });
    const step = applyPolicy(s);
    expect(step.state).toBe('blocked');
    expect(step.neutralEvent).toBe('risk.policy-blocked');
  });

  it('score capped at 100', () => {
    const s = startRiskEval({ platform: 'chromium', userId: 'u-1' });
    const step = evaluateScore(s, {
      signals: {
        deviceScore: 50,
        ipReputation: 50,
        geoAnomaly: 50,
        velocityScore: 50,
        behavioralScore: 50,
      },
    });
    expect(step.metadata.score).toBe(100);
  });

  it('injectChallenge rejects when score in allow range', () => {
    const s = startRiskEval({ platform: 'chromium', userId: 'u-1' });
    evaluateScore(s, { signals: lowSignals });
    expect(() => injectChallenge(s, { challenge: 'sms' })).toThrow(/challenge range/);
  });

  it('applyPolicy after challenge still fires block/allow decision', () => {
    const s = startRiskEval({ platform: 'webkit', userId: 'u-1' });
    evaluateScore(s, { signals: midSignals });
    injectChallenge(s, { challenge: 'sms' });
    const step = applyPolicy(s);
    expect(['allowed', 'blocked']).toContain(step.state);
  });

  it('history accumulates in order', () => {
    const s = startRiskEval({ platform: 'chromium', userId: 'u-1' });
    evaluateScore(s, { signals: highSignals });
    applyPolicy(s);
    expect(s.history.map((step) => step.neutralEvent)).toEqual([
      'risk.score-evaluated',
      'risk.policy-blocked',
    ]);
  });
});
