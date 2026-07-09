/**
 * v1.39-5 docs 補強 (Issue #1121 / CAR-867) — tutorial 82-84 code snippet validation
 * for `@kiwa-lab/security` v0.2 advanced II 8 axis (mTLS + Zero-trust + SIEM audit +
 * Incident response + Cryptography advanced + Container/K8s + Supply chain +
 * Web Vitals security).
 *
 * `docs/tutorials/82-mtls-zero-trust.md` /
 * `docs/tutorials/83-siem-incident-response.md` /
 * `docs/tutorials/84-supply-chain-slsa.md` に載っている snippet が実際に動作する
 * ことを担保する。
 *
 * v1.23 → v1.39 で 17 milestone 連続 snippet validation streak を延伸。
 */
import { describe, expect, it } from 'vitest';
import {
  applyRetention,
  captureForensics,
  checkCtLog,
  classifySeverity,
  completeHandshake,
  correlate,
  enforceMicroSegment,
  escalate,
  evaluatePosture,
  matchReproducibleBuild,
  recordPostMortem,
  requestJit,
  scoreRisk,
  sealEvents,
  signProvenance,
  startIncidentSession,
  startMtlsSession,
  startSiemAuditSession,
  startSupplyChainSession,
  startZeroTrustSession,
  structureEvent,
  triggerPlaybook,
  verifyAttestation,
  verifyOcsp,
  verifyPin,
  verifySlsaLevel,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 82 — mTLS + Zero-trust (handshake + pin + OCSP + CT + posture + risk + JIT + segment)
// ---------------------------------------------------------------------------

describe('tutorial 82 — mtls handshake', () => {
  it('completes a TLS 1.3 handshake and moves state to handshake-completed (tutorial: handshake snippet)', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-1' });
    const step = completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    expect(step.neutralEvent).toBe('mtls.handshake_completed');
    expect(s.state).toBe('handshake-completed');
  });

  it('refuses to handshake on a non-idle session (tutorial: session-reuse guard snippet)', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-2' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    expect(() =>
      completeHandshake(s, {
        peerCn: 'api2.example.com',
        cipherSuite: 'TLS_AES_256_GCM_SHA384',
        tlsVersion: '1.3',
      }),
    ).toThrow(/session is handshake-completed, cannot handshake/);
  });

  it('emits a provider-specific dialect while keeping the neutral event stable (tutorial: dialect snippet)', () => {
    const s = startMtlsSession({ target: 'opa', sessionId: 's-3' });
    const step = completeHandshake(s, {
      peerCn: 'peer.example.com',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    expect(step.neutralEvent).toBe('mtls.handshake_completed');
    expect(step.providerEvent).toBe('opa.mtls.handshake');
  });
});

describe('tutorial 82 — mtls SPKI pin', () => {
  it('accepts a matching SPKI hash and moves state to pinned (tutorial: pin match snippet)', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-1' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    const step = verifyPin(s, {
      spkiSha256: 'aaa111',
      expectedPins: ['aaa111', 'bbb222'],
    });
    expect(step.metadata.matched).toBe(true);
    expect(s.state).toBe('pinned');
    expect(s.pinnedFingerprints).toEqual(['aaa111']);
  });

  it('flips state to failed on a non-matching pin (tutorial: MITM guard snippet)', () => {
    const s = startMtlsSession({ target: 'opa', sessionId: 's-2' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    const step = verifyPin(s, {
      spkiSha256: 'unknown-hash',
      expectedPins: ['aaa111', 'bbb222'],
    });
    expect(step.metadata.matched).toBe(false);
    expect(s.state).toBe('failed');
  });

  it('refuses an empty expectedPins allowlist (tutorial: silent no-op guard snippet)', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-3' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    expect(() => verifyPin(s, { spkiSha256: 'aaa', expectedPins: [] })).toThrow(
      /expectedPins must not be empty/,
    );
  });
});

describe('tutorial 82 — mtls OCSP staple', () => {
  it('moves state to ocsp-verified on a good stapled response (tutorial: OCSP good snippet)', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-1' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    const step = verifyOcsp(s, { stapled: true, goodResponse: true });
    expect(step.metadata.stapled).toBe(true);
    expect(step.metadata.good).toBe(true);
    expect(s.state).toBe('ocsp-verified');
  });

  it('flips state to failed on a missing staple (tutorial: fail-closed invariant snippet)', () => {
    const s = startMtlsSession({ target: 'opa', sessionId: 's-2' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    const step = verifyOcsp(s, { stapled: false, goodResponse: true });
    expect(step.metadata.stapled).toBe(false);
    expect(s.state).toBe('failed');
  });

  it('flips state to failed on a stapled but revoked response (tutorial: revoked snippet)', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-3' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    const step = verifyOcsp(s, { stapled: true, goodResponse: false });
    expect(step.metadata.stapled).toBe(true);
    expect(step.metadata.good).toBe(false);
    expect(s.state).toBe('failed');
  });
});

describe('tutorial 82 — mtls CT log', () => {
  it('accepts SCT count above the required minimum (tutorial: CT ok snippet)', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-1' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    verifyOcsp(s, { stapled: true, goodResponse: true });
    const step = checkCtLog(s, { sctCount: 3, minSctRequired: 2 });
    expect(step.metadata.ok).toBe(true);
    expect(s.state).toBe('ct-verified');
  });

  it('flips to failed when SCT count is below the minimum (tutorial: CT insufficient snippet)', () => {
    const s = startMtlsSession({ target: 'opa', sessionId: 's-2' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    verifyOcsp(s, { stapled: true, goodResponse: true });
    const step = checkCtLog(s, { sctCount: 1, minSctRequired: 2 });
    expect(step.metadata.ok).toBe(false);
    expect(s.state).toBe('failed');
  });

  it('refuses a negative minSctRequired (tutorial: config typo guard snippet)', () => {
    const s = startMtlsSession({ target: 'istio', sessionId: 's-3' });
    completeHandshake(s, {
      peerCn: 'api.example.com',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      tlsVersion: '1.3',
    });
    verifyPin(s, { spkiSha256: 'aaa', expectedPins: ['aaa'] });
    verifyOcsp(s, { stapled: true, goodResponse: true });
    expect(() => checkCtLog(s, { sctCount: 3, minSctRequired: -1 })).toThrow(
      /minSctRequired must be non-negative/,
    );
  });
});

describe('tutorial 82 — zero-trust device posture', () => {
  it('emits passed=true when all 4 signals are present (tutorial: posture pass snippet)', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-1' });
    const step = evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    expect(step.metadata.passed).toBe(true);
    expect(s.state).toBe('posture-evaluated');
  });

  it('emits passed=false when any one of the 4 signals is missing (tutorial: posture fail snippet)', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-2' });
    const step = evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: false,
      edrRunning: true,
      mdmEnrolled: true,
    });
    expect(step.metadata.passed).toBe(false);
    expect(step.metadata.diskEncrypted).toBe(false);
  });

  it('refuses to re-evaluate posture on a non-idle session (tutorial: single-shot guard snippet)', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-3' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    expect(() =>
      evaluatePosture(s, {
        osUpToDate: true,
        diskEncrypted: true,
        edrRunning: true,
        mdmEnrolled: true,
      }),
    ).toThrow(/must be idle/);
  });
});

describe('tutorial 82 — zero-trust risk score + JIT', () => {
  it('grants JIT when accumulated risk is under 50 (tutorial: JIT allow snippet)', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-1' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    scoreRisk(s, {
      unusualLocation: true,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    const step = requestJit(s, {
      requestedRole: 'db-admin',
      justification: 'break-glass access for incident triage',
      ttlSeconds: 900,
    });
    expect(step.metadata.granted).toBe(true);
    expect(s.state).toBe('jit-granted');
    expect(s.grantedRoles).toEqual(['db-admin']);
  });

  it('denies JIT when accumulated risk is 50 or higher (tutorial: JIT deny snippet)', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-2' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    scoreRisk(s, {
      unusualLocation: true,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: true,
    });
    const step = requestJit(s, {
      requestedRole: 'db-admin',
      justification: 'break-glass access for incident triage',
      ttlSeconds: 900,
    });
    expect(step.metadata.granted).toBe(false);
    expect(s.state).toBe('jit-denied');
    expect(s.grantedRoles).toEqual([]);
  });

  it('refuses a JIT ttlSeconds out of the 1..3600 window (tutorial: ttl guard snippet)', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-3' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    scoreRisk(s, {
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    expect(() =>
      requestJit(s, {
        requestedRole: 'db-admin',
        justification: 'break-glass access',
        ttlSeconds: 86400,
      }),
    ).toThrow(/ttlSeconds must be 1..3600/);
  });
});

describe('tutorial 82 — zero-trust micro-segmentation', () => {
  it('allows a peer inside the allowedPeers allowlist (tutorial: segment allow snippet)', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-1' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    scoreRisk(s, {
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    requestJit(s, {
      requestedRole: 'db-admin',
      justification: 'break-glass access',
      ttlSeconds: 900,
    });
    const step = enforceMicroSegment(s, {
      workload: 'analytics-service',
      allowedPeers: ['postgres-primary', 'redis-cache'],
      requestedPeer: 'postgres-primary',
    });
    expect(step.metadata.allowed).toBe(true);
    expect(s.state).toBe('segment-enforced');
  });

  it('denies a peer outside the allowedPeers allowlist but still audits it (tutorial: segment deny + audit snippet)', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's-2' });
    evaluatePosture(s, {
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    scoreRisk(s, {
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    requestJit(s, {
      requestedRole: 'db-admin',
      justification: 'break-glass access',
      ttlSeconds: 900,
    });
    const step = enforceMicroSegment(s, {
      workload: 'analytics-service',
      allowedPeers: ['postgres-primary', 'redis-cache'],
      requestedPeer: 'stripe-webhook',
    });
    expect(step.metadata.allowed).toBe(false);
    expect(s.state).toBe('segment-enforced');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 83 — SIEM audit + Incident response
// ---------------------------------------------------------------------------

describe('tutorial 83 — siem structureEvent', () => {
  it('normalizes a raw event into a Splunk-CIM-shaped structured event (tutorial: CIM snippet)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-1' });
    const { event, step } = structureEvent(s, {
      actor: 'user@example.com',
      action: 'login',
      target: 'auth-service',
      timestamp: 1_700_000_000,
      result: 'success',
    });
    expect(event.eventId).toBe('evt-1');
    expect(event.cimSchemaVersion).toBe('1.0');
    expect(step.neutralEvent).toBe('siem.event_structured');
    expect(s.state).toBe('structured');
  });

  it('appends event ids monotonically inside the same session (tutorial: monotonic id snippet)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-2' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    const { event } = structureEvent(s, {
      actor: 'b@x',
      action: 'login',
      target: 'svc',
      timestamp: 2,
      result: 'failure',
    });
    expect(event.eventId).toBe('evt-2');
    expect(s.structuredEvents).toHaveLength(2);
  });

  it('rejects an empty actor / action / target (tutorial: null event guard snippet)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-3' });
    expect(() =>
      structureEvent(s, {
        actor: '',
        action: 'login',
        target: 'svc',
        timestamp: 1,
        result: 'success',
      }),
    ).toThrow(/actor \/ action \/ target must not be empty/);
  });
});

describe('tutorial 83 — siem sealEvents', () => {
  it('emits a hash chained onto the previous seal (tutorial: hash chain snippet)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-1' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    const step = sealEvents(s, { previousHash: 'root-hash' });
    expect(step.metadata.previousHash).toBe('root-hash');
    expect(step.metadata.eventCount).toBe(1);
    expect(String(step.metadata.sealHash)).toMatch(/^sha-/);
    expect(s.sealHashChain).toHaveLength(1);
    expect(s.state).toBe('sealed');
  });

  it('refuses to seal an idle session (tutorial: empty batch guard snippet)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-2' });
    expect(() => sealEvents(s, { previousHash: 'root' })).toThrow(
      /no structured events to seal/,
    );
  });

  it('produces a stable hash for the same input (tutorial: determinism snippet)', () => {
    const s1 = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-1' });
    structureEvent(s1, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    const step1 = sealEvents(s1, { previousHash: 'root' });

    const s2 = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-2' });
    structureEvent(s2, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    const step2 = sealEvents(s2, { previousHash: 'root' });

    expect(step1.metadata.sealHash).toBe(step2.metadata.sealHash);
  });
});

describe('tutorial 83 — siem applyRetention', () => {
  it('records hot + warm + cold days plus legal-hold toggle (tutorial: retention snippet)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-1' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    sealEvents(s, { previousHash: 'root' });
    const step = applyRetention(s, {
      hotDays: 7,
      warmDays: 30,
      coldDays: 365,
      legalHold: false,
    });
    expect(step.metadata.hotDays).toBe(7);
    expect(step.metadata.totalDays).toBe(402);
    expect(step.metadata.legalHold).toBe(false);
    expect(s.state).toBe('retention-tagged');
  });

  it('rejects negative retention days (tutorial: negative day guard snippet)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-2' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    sealEvents(s, { previousHash: 'root' });
    expect(() =>
      applyRetention(s, {
        hotDays: 7,
        warmDays: -1,
        coldDays: 365,
        legalHold: false,
      }),
    ).toThrow(/must be non-negative/);
  });
});

describe('tutorial 83 — siem correlate', () => {
  it('emits matched=true when every required event id is present (tutorial: correlate match snippet)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-1' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'failure',
    });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 2,
      result: 'failure',
    });
    sealEvents(s, { previousHash: 'root' });
    applyRetention(s, { hotDays: 7, warmDays: 30, coldDays: 365, legalHold: false });
    const step = correlate(s, {
      ruleId: 'brute-force-detector',
      requiredEventIds: ['evt-1', 'evt-2'],
      windowMs: 60_000,
    });
    expect(step.metadata.matched).toBe(true);
    expect(s.state).toBe('correlated');
  });

  it('emits matched=false when any required event id is missing (tutorial: correlate partial snippet)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-2' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'failure',
    });
    sealEvents(s, { previousHash: 'root' });
    applyRetention(s, { hotDays: 7, warmDays: 30, coldDays: 365, legalHold: false });
    const step = correlate(s, {
      ruleId: 'brute-force-detector',
      requiredEventIds: ['evt-1', 'evt-2'],
      windowMs: 60_000,
    });
    expect(step.metadata.matched).toBe(false);
  });

  it('refuses a rule with 0 required event ids (tutorial: always-fire guard snippet)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-3' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    sealEvents(s, { previousHash: 'root' });
    applyRetention(s, { hotDays: 7, warmDays: 30, coldDays: 365, legalHold: false });
    expect(() =>
      correlate(s, { ruleId: 'noop', requiredEventIds: [], windowMs: 60_000 }),
    ).toThrow(/must require >= 1 event id/);
  });
});

describe('tutorial 83 — incident triggerPlaybook', () => {
  it('records playbook id + detection source + initial alert (tutorial: playbook snippet)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-1' });
    const step = triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'brute-force-detector',
      initialAlert: '20 failed logins from IP 1.2.3.4 in 60s',
    });
    expect(step.metadata.playbookId).toBe('IR-BF-001');
    expect(s.state).toBe('playbook-triggered');
    expect(s.playbookId).toBe('IR-BF-001');
  });

  it('refuses an empty playbook id (tutorial: unnamed runbook guard snippet)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-2' });
    expect(() =>
      triggerPlaybook(s, {
        playbookId: '',
        detectionSource: 'x',
        initialAlert: 'y',
      }),
    ).toThrow(/playbookId must not be empty/);
  });
});

describe('tutorial 83 — incident classifySeverity + escalate', () => {
  it('classifies restricted + service-down as sev1 (tutorial: sev1 snippet)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-1' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    const step = classifySeverity(s, {
      affectedUsers: 5000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    expect(step.metadata.severity).toBe('sev1');
    expect(s.severity).toBe('sev1');
  });

  it('classifies confidential data + no service down as sev3 (tutorial: sev3 snippet)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-2' });
    triggerPlaybook(s, {
      playbookId: 'IR-DF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    const step = classifySeverity(s, {
      affectedUsers: 5,
      dataClassification: 'confidential',
      serviceDown: false,
    });
    expect(step.metadata.severity).toBe('sev3');
  });

  it('escalates to at least one channel with primary + optional secondary on-call (tutorial: escalate snippet)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-3' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    classifySeverity(s, {
      affectedUsers: 1000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    const step = escalate(s, {
      channels: ['pagerduty', 'slack'],
      onCallPrimary: 'alice@example.com',
      onCallSecondary: 'bob@example.com',
    });
    expect(step.metadata.channelCount).toBe(2);
    expect(step.metadata.hasSecondary).toBe(true);
    expect(s.state).toBe('escalated');
  });

  it('refuses to escalate with no channels (tutorial: silent drop guard snippet)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-4' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    classifySeverity(s, {
      affectedUsers: 1,
      dataClassification: 'public',
      serviceDown: false,
    });
    expect(() =>
      escalate(s, {
        channels: [],
        onCallPrimary: 'a@x',
        onCallSecondary: null,
      }),
    ).toThrow(/at least one channel required/);
  });
});

describe('tutorial 83 — incident forensics + post-mortem', () => {
  it('records artifact sizes and appends non-empty artifact names (tutorial: forensics snippet)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-1' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    classifySeverity(s, {
      affectedUsers: 1000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    escalate(s, {
      channels: ['pagerduty'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    const step = captureForensics(s, {
      memoryDumpMb: 512,
      networkPcapMb: 128,
      diskImageGb: 40,
    });
    expect(step.metadata.artifactCount).toBe(3);
    expect(s.forensicsArtifacts).toEqual([
      'memory-dump',
      'network-pcap',
      'disk-image',
    ]);
    expect(s.state).toBe('forensics-captured');
  });

  it('records a post-mortem with root cause + action items (tutorial: post-mortem snippet)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-2' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    classifySeverity(s, {
      affectedUsers: 1000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    escalate(s, {
      channels: ['pagerduty'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    captureForensics(s, {
      memoryDumpMb: 512,
      networkPcapMb: 128,
      diskImageGb: 40,
    });
    const step = recordPostMortem(s, {
      rootCause: 'brute-force rate limiter mis-tuned (window too wide)',
      contributingFactors: ['no distributed rate limit', 'no alert on 500-response spike'],
      actionItems: [
        'tighten rate limit window to 60s',
        'add 500-response spike alert',
      ],
    });
    expect(step.metadata.actionItemCount).toBe(2);
    expect(s.state).toBe('post-mortem-recorded');
  });

  it('refuses a short root cause (tutorial: shallow post-mortem guard snippet)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-3' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    classifySeverity(s, {
      affectedUsers: 1000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    escalate(s, {
      channels: ['pagerduty'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    captureForensics(s, {
      memoryDumpMb: 512,
      networkPcapMb: 128,
      diskImageGb: 40,
    });
    expect(() =>
      recordPostMortem(s, {
        rootCause: 'oops',
        contributingFactors: [],
        actionItems: ['fix it'],
      }),
    ).toThrow(/rootCause must be >= 10 chars/);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 84 — Supply chain SLSA (level + reproducible + provenance + attestation)
// ---------------------------------------------------------------------------

describe('tutorial 84 — supply-chain verifySlsaLevel', () => {
  it('classifies a fully-signed isolated non-parameterized build as SLSA 4 (tutorial: SLSA 4 snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-1' });
    const step = verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    expect(step.metadata.level).toBe(4);
    expect(s.verifiedLevel).toBe(4);
    expect(s.state).toBe('slsa-verified');
  });

  it('classifies a level 3 build that is still parameterizable (tutorial: SLSA 3 snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-2' });
    const step = verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: true,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    expect(step.metadata.level).toBe(3);
  });

  it('classifies a level 2 build that is missing isolation (tutorial: SLSA 2 snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-3' });
    const step = verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: true,
      buildIsolated: false,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: false,
    });
    expect(step.metadata.level).toBe(2);
  });

  it('classifies a build with no provenance as SLSA 0 (tutorial: SLSA 0 fallback snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-4' });
    const step = verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: false,
      buildParameterizable: true,
      buildIsolated: false,
      provenanceExists: false,
      provenanceAuthenticated: false,
      provenanceServiceGenerated: false,
      provenanceNonFalsifiable: false,
    });
    expect(step.metadata.level).toBe(0);
  });
});

describe('tutorial 84 — supply-chain matchReproducibleBuild', () => {
  it('emits matched=true when two independent builds produce the same hash (tutorial: match snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-1' });
    verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    const step = matchReproducibleBuild(s, {
      buildA_hash: 'sha256:abc123',
      buildB_hash: 'sha256:abc123',
      toolchainVersion: 'nixpkgs-24.05',
    });
    expect(step.metadata.matched).toBe(true);
    expect(s.state).toBe('reproducible-matched');
  });

  it('emits matched=false when build hashes drift (tutorial: toolchain drift snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-2' });
    verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    const step = matchReproducibleBuild(s, {
      buildA_hash: 'sha256:abc123',
      buildB_hash: 'sha256:def456',
      toolchainVersion: 'nixpkgs-24.05',
    });
    expect(step.metadata.matched).toBe(false);
  });

  it('refuses empty hashes (tutorial: no-op guard snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-3' });
    verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    expect(() =>
      matchReproducibleBuild(s, {
        buildA_hash: '',
        buildB_hash: '',
        toolchainVersion: 'nixpkgs-24.05',
      }),
    ).toThrow(/build hashes must not be empty/);
  });
});

describe('tutorial 84 — supply-chain signProvenance', () => {
  it('records builder id + materials count + sigstore-cosign algorithm (tutorial: sigstore snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-1' });
    verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    matchReproducibleBuild(s, {
      buildA_hash: 'sha256:abc',
      buildB_hash: 'sha256:abc',
      toolchainVersion: 'nixpkgs-24.05',
    });
    const step = signProvenance(s, {
      builderId: 'github-actions/runner-image-ubuntu-22.04',
      materialsCount: 42,
      signatureAlgorithm: 'sigstore-cosign',
    });
    expect(step.metadata.signatureAlgorithm).toBe('sigstore-cosign');
    expect(step.metadata.materialsCount).toBe(42);
    expect(s.state).toBe('provenance-signed');
  });

  it('accepts in-toto as an alternate signing algorithm (tutorial: in-toto snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-1' });
    verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    matchReproducibleBuild(s, {
      buildA_hash: 'sha256:abc',
      buildB_hash: 'sha256:abc',
      toolchainVersion: 'nixpkgs-24.05',
    });
    const step = signProvenance(s, {
      builderId: 'nix-builder',
      materialsCount: 12,
      signatureAlgorithm: 'in-toto',
    });
    expect(step.metadata.signatureAlgorithm).toBe('in-toto');
  });

  it('refuses an empty builder id (tutorial: unnamed builder guard snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-3' });
    verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    matchReproducibleBuild(s, {
      buildA_hash: 'sha256:abc',
      buildB_hash: 'sha256:abc',
      toolchainVersion: 'nixpkgs-24.05',
    });
    expect(() =>
      signProvenance(s, {
        builderId: '',
        materialsCount: 1,
        signatureAlgorithm: 'sigstore-cosign',
      }),
    ).toThrow(/builderId must not be empty/);
  });
});

describe('tutorial 84 — supply-chain verifyAttestation', () => {
  it('records attestation type + trust root + valid signature count (tutorial: attestation snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-1' });
    verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    matchReproducibleBuild(s, {
      buildA_hash: 'sha256:abc',
      buildB_hash: 'sha256:abc',
      toolchainVersion: 'nixpkgs-24.05',
    });
    signProvenance(s, {
      builderId: 'gha-runner',
      materialsCount: 42,
      signatureAlgorithm: 'sigstore-cosign',
    });
    const step = verifyAttestation(s, {
      attestationType: 'slsa-provenance',
      trustRootFingerprint: 'sha256:root-fingerprint',
      validSignatures: 2,
    });
    expect(step.metadata.attestationType).toBe('slsa-provenance');
    expect(step.metadata.validSignatures).toBe(2);
    expect(s.state).toBe('attestation-verified');
  });

  it('accepts spdx-sbom as an alternate attestation type (tutorial: SPDX SBOM snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-1' });
    verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    matchReproducibleBuild(s, {
      buildA_hash: 'sha256:abc',
      buildB_hash: 'sha256:abc',
      toolchainVersion: 'nixpkgs-24.05',
    });
    signProvenance(s, {
      builderId: 'gha-runner',
      materialsCount: 42,
      signatureAlgorithm: 'sigstore-cosign',
    });
    const step = verifyAttestation(s, {
      attestationType: 'spdx-sbom',
      trustRootFingerprint: 'sha256:root',
      validSignatures: 1,
    });
    expect(step.metadata.attestationType).toBe('spdx-sbom');
  });

  it('refuses zero valid signatures (tutorial: unsigned attestation guard snippet)', () => {
    const s = startSupplyChainSession({ target: 'vault', sessionId: 's-3' });
    verifySlsaLevel(s, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    matchReproducibleBuild(s, {
      buildA_hash: 'sha256:abc',
      buildB_hash: 'sha256:abc',
      toolchainVersion: 'nixpkgs-24.05',
    });
    signProvenance(s, {
      builderId: 'gha-runner',
      materialsCount: 42,
      signatureAlgorithm: 'sigstore-cosign',
    });
    expect(() =>
      verifyAttestation(s, {
        attestationType: 'slsa-provenance',
        trustRootFingerprint: 'sha256:root',
        validSignatures: 0,
      }),
    ).toThrow(/at least one valid signature required/);
  });
});
