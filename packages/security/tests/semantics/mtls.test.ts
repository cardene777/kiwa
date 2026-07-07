import { describe, expect, it } from 'vitest';
import {
  checkCtLog,
  completeHandshake,
  startMtlsSession,
  verifyOcsp,
  verifyPin,
} from '../../src/semantics/index.js';

describe('startMtlsSession', () => {
  it('creates idle session for istio', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's1' });
    expect(s.state).toBe('idle');
    expect(s.target).toBe('istio');
    expect(s.history).toEqual([]);
    expect(s.pinnedFingerprints).toEqual([]);
  });

  it('throws when sessionId is empty', () => {
    expect(() => startMtlsSession({ target: 'opa', sessionId: '' })).toThrow(
      'sessionId must not be empty',
    );
  });

  it.each(['istio', 'opa', 'siem-splunk', 'vault'] as const)(
    'supports every provider target (%s)',
    (target) => {
      const s = startMtlsSession({ target, sessionId: 's' });
      expect(s.target).toBe(target);
    },
  );
});

describe('completeHandshake', () => {
  it('transitions idle -> handshake-completed on valid TLS 1.3', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    const step = completeHandshake(s, {
      peerCn: 'svc.local',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    expect(s.state).toBe('handshake-completed');
    expect(step.neutralEvent).toBe('mtls.handshake_completed');
    expect(step.providerEvent).toBe('istio.mtls.handshake');
  });

  it('supports TLS 1.2', () => {
    const s = startMtlsSession({ target: 'opa', sessionId: 's' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.2' });
    expect(s.state).toBe('handshake-completed');
  });

  it('throws when session is not idle', () => {
    const s = startMtlsSession({ target: 'vault', sessionId: 's' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
    expect(() =>
      completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' }),
    ).toThrow('cannot handshake');
  });

  it('rejects unknown TLS version', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    expect(() =>
      completeHandshake(s, {
        peerCn: 'a',
        cipherSuite: 'X',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tlsVersion: '1.0' as any,
      }),
    ).toThrow('only TLS 1.2 / 1.3');
  });

  it('emits provider-specific event name per target', () => {
    for (const target of ['istio', 'opa', 'siem-splunk', 'vault'] as const) {
      const s = startMtlsSession({ target, sessionId: 's' });
      const step = completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
      expect(step.providerEvent).toContain('.mtls.handshake');
    }
  });
});

describe('verifyPin', () => {
  it('marks matched pin as pinned', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
    const step = verifyPin(s, {
      spkiSha256: 'abc',
      expectedPins: ['abc', 'def'],
    });
    expect(s.state).toBe('pinned');
    expect(s.pinnedFingerprints).toContain('abc');
    expect(step.metadata['matched']).toBe(true);
  });

  it('marks mismatched pin as failed', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
    const step = verifyPin(s, { spkiSha256: 'xyz', expectedPins: ['abc'] });
    expect(s.state).toBe('failed');
    expect(step.metadata['matched']).toBe(false);
  });

  it('throws when no handshake', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    expect(() =>
      verifyPin(s, { spkiSha256: 'abc', expectedPins: ['abc'] }),
    ).toThrow('must have completed handshake');
  });

  it('throws when expectedPins is empty', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
    expect(() => verifyPin(s, { spkiSha256: 'abc', expectedPins: [] })).toThrow(
      'expectedPins must not be empty',
    );
  });
});

describe('verifyOcsp', () => {
  it('transitions to ocsp-verified when stapled and good', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
    verifyPin(s, { spkiSha256: 'abc', expectedPins: ['abc'] });
    const step = verifyOcsp(s, { stapled: true, goodResponse: true });
    expect(s.state).toBe('ocsp-verified');
    expect(step.metadata['stapled']).toBe(true);
    expect(step.metadata['good']).toBe(true);
  });

  it('marks failed when not stapled', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
    verifyPin(s, { spkiSha256: 'abc', expectedPins: ['abc'] });
    verifyOcsp(s, { stapled: false, goodResponse: true });
    expect(s.state).toBe('failed');
  });

  it('marks failed when stapled but revoked', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
    verifyPin(s, { spkiSha256: 'abc', expectedPins: ['abc'] });
    verifyOcsp(s, { stapled: true, goodResponse: false });
    expect(s.state).toBe('failed');
  });

  it('throws when no pin verified', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    expect(() => verifyOcsp(s, { stapled: true, goodResponse: true })).toThrow(
      'need handshake / pin first',
    );
  });
});

describe('checkCtLog', () => {
  it('marks ct-verified when sctCount >= minSctRequired', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
    verifyPin(s, { spkiSha256: 'abc', expectedPins: ['abc'] });
    verifyOcsp(s, { stapled: true, goodResponse: true });
    const step = checkCtLog(s, { sctCount: 3, minSctRequired: 2 });
    expect(s.state).toBe('ct-verified');
    expect(step.metadata['ok']).toBe(true);
  });

  it('marks failed when sctCount < minSctRequired', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
    verifyPin(s, { spkiSha256: 'abc', expectedPins: ['abc'] });
    verifyOcsp(s, { stapled: true, goodResponse: true });
    checkCtLog(s, { sctCount: 1, minSctRequired: 2 });
    expect(s.state).toBe('failed');
  });

  it('throws when idle', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    expect(() => checkCtLog(s, { sctCount: 3, minSctRequired: 2 })).toThrow(
      'must have handshake first',
    );
  });

  it('throws when minSctRequired negative', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
    verifyPin(s, { spkiSha256: 'abc', expectedPins: ['abc'] });
    verifyOcsp(s, { stapled: true, goodResponse: true });
    expect(() => checkCtLog(s, { sctCount: 1, minSctRequired: -1 })).toThrow(
      'minSctRequired must be non-negative',
    );
  });
});

describe('mtls end-to-end', () => {
  it('completes full happy path through 4 steps', () => {
    const s = startMtlsSession({ target: 'vault', sessionId: 'e2e' });
    completeHandshake(s, {
      peerCn: 'svc.cluster.local',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'sha', expectedPins: ['sha'] });
    verifyOcsp(s, { stapled: true, goodResponse: true });
    checkCtLog(s, { sctCount: 3, minSctRequired: 2 });
    expect(s.state).toBe('ct-verified');
    expect(s.history).toHaveLength(4);
  });

  it('records history in call order', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 'h' });
    completeHandshake(s, { peerCn: 'a', cipherSuite: 'X', tlsVersion: '1.3' });
    verifyPin(s, { spkiSha256: 'abc', expectedPins: ['abc'] });
    expect(s.history[0]?.neutralEvent).toBe('mtls.handshake_completed');
    expect(s.history[1]?.neutralEvent).toBe('mtls.cert_pinned');
  });
});
