import { describe, expect, it } from 'vitest';
import {
  enforceMicroSegment,
  evaluatePosture,
  requestJit,
  scoreRisk,
  startZeroTrustSession,
} from '../../src/semantics/index.js';

describe('startZeroTrustSession', () => {
  it('creates idle session', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    expect(s.state).toBe('idle');
    expect(s.riskScore).toBe(0);
    expect(s.grantedRoles).toEqual([]);
  });

  it('throws when sessionId is empty', () => {
    expect(() => startZeroTrustSession({ target: 'opa', sessionId: '' })).toThrow(
      'sessionId must not be empty',
    );
  });
});

describe('evaluatePosture', () => {
  const strict = {
    osUpToDate: true,
    diskEncrypted: true,
    edrRunning: true,
    mdmEnrolled: true,
  };

  it('passes strict posture', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    const step = evaluatePosture(s, strict);
    expect(s.state).toBe('posture-evaluated');
    expect(step.metadata['passed']).toBe(true);
  });

  it('fails when any signal is false', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    const step = evaluatePosture(s, { ...strict, edrRunning: false });
    expect(step.metadata['passed']).toBe(false);
  });

  it('throws when not idle', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    evaluatePosture(s, strict);
    expect(() => evaluatePosture(s, strict)).toThrow('must be idle');
  });
});

describe('scoreRisk', () => {
  const strict = {
    osUpToDate: true,
    diskEncrypted: true,
    edrRunning: true,
    mdmEnrolled: true,
  };

  it('scores 0 for clean signals', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    evaluatePosture(s, strict);
    const step = scoreRisk(s, {
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    expect(s.riskScore).toBe(0);
    expect(step.metadata['riskScore']).toBe(0);
  });

  it('sums risk signals correctly', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    evaluatePosture(s, strict);
    scoreRisk(s, {
      unusualLocation: true,
      unusualTime: true,
      newDevice: true,
      threatIntelHit: true,
    });
    expect(s.riskScore).toBe(100);
  });

  it('caps at 100 for all-hit', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    evaluatePosture(s, strict);
    scoreRisk(s, {
      unusualLocation: true,
      unusualTime: true,
      newDevice: true,
      threatIntelHit: true,
    });
    expect(s.riskScore).toBeLessThanOrEqual(100);
  });

  it('throws when posture not evaluated', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    expect(() =>
      scoreRisk(s, {
        unusualLocation: false,
        unusualTime: false,
        newDevice: false,
        threatIntelHit: false,
      }),
    ).toThrow('posture must be evaluated');
  });
});

describe('requestJit', () => {
  const strict = {
    osUpToDate: true,
    diskEncrypted: true,
    edrRunning: true,
    mdmEnrolled: true,
  };
  const cleanSignals = {
    unusualLocation: false,
    unusualTime: false,
    newDevice: false,
    threatIntelHit: false,
  };

  it('grants when risk < 50', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    evaluatePosture(s, strict);
    scoreRisk(s, cleanSignals);
    requestJit(s, {
      requestedRole: 'db-admin',
      justification: 'emergency schema fix for issue',
      ttlSeconds: 900,
    });
    expect(s.state).toBe('jit-granted');
    expect(s.grantedRoles).toContain('db-admin');
  });

  it('denies when risk >= 50', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    evaluatePosture(s, strict);
    scoreRisk(s, {
      unusualLocation: true,
      unusualTime: true,
      newDevice: false,
      threatIntelHit: true,
    });
    requestJit(s, {
      requestedRole: 'db-admin',
      justification: 'emergency schema fix for issue',
      ttlSeconds: 900,
    });
    expect(s.state).toBe('jit-denied');
    expect(s.grantedRoles).not.toContain('db-admin');
  });

  it('throws when ttl invalid', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    evaluatePosture(s, strict);
    scoreRisk(s, cleanSignals);
    expect(() =>
      requestJit(s, {
        requestedRole: 'x',
        justification: 'valid justification text',
        ttlSeconds: 0,
      }),
    ).toThrow('ttlSeconds must be');
    expect(() =>
      requestJit(s, {
        requestedRole: 'x',
        justification: 'valid justification text',
        ttlSeconds: 4000,
      }),
    ).toThrow('ttlSeconds must be');
  });

  it('throws on short justification', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    evaluatePosture(s, strict);
    scoreRisk(s, cleanSignals);
    expect(() =>
      requestJit(s, { requestedRole: 'x', justification: 'short', ttlSeconds: 900 }),
    ).toThrow('>= 10 chars');
  });
});

describe('enforceMicroSegment', () => {
  const strict = {
    osUpToDate: true,
    diskEncrypted: true,
    edrRunning: true,
    mdmEnrolled: true,
  };
  const cleanSignals = {
    unusualLocation: false,
    unusualTime: false,
    newDevice: false,
    threatIntelHit: false,
  };

  it('allows peer in allowlist', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    evaluatePosture(s, strict);
    scoreRisk(s, cleanSignals);
    requestJit(s, {
      requestedRole: 'db-admin',
      justification: 'emergency schema fix for issue',
      ttlSeconds: 900,
    });
    const step = enforceMicroSegment(s, {
      workload: 'api',
      allowedPeers: ['db', 'cache'],
      requestedPeer: 'db',
    });
    expect(step.metadata['allowed']).toBe(true);
    expect(s.state).toBe('segment-enforced');
  });

  it('denies peer outside allowlist', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    evaluatePosture(s, strict);
    scoreRisk(s, cleanSignals);
    requestJit(s, {
      requestedRole: 'db-admin',
      justification: 'emergency schema fix for issue',
      ttlSeconds: 900,
    });
    const step = enforceMicroSegment(s, {
      workload: 'api',
      allowedPeers: ['db'],
      requestedPeer: 'admin',
    });
    expect(step.metadata['allowed']).toBe(false);
  });

  it('throws when JIT not granted', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    expect(() =>
      enforceMicroSegment(s, {
        workload: 'api',
        allowedPeers: ['db'],
        requestedPeer: 'db',
      }),
    ).toThrow('JIT must be granted');
  });
});
