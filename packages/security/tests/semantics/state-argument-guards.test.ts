import { describe, expect, it } from 'vitest';
import {
  applyNetworkPolicy,
  applyPermissionsPolicy,
  applyRetention,
  captureForensics,
  classifySeverity,
  correlate,
  decideAdmission,
  enforceCrossOriginIsolation,
  enforcePodSecurity,
  enforceTrustedTypes,
  escalate,
  matchReproducibleBuild,
  providerAdvEventName,
  recordPostMortem,
  requestJit,
  resolveAdvRealDriver,
  sealEvents,
  signProvenance,
  signWithHsm,
  startCryptoSession,
  startIncidentSession,
  startK8sSession,
  startSiemAuditSession,
  startSupplyChainSession,
  startWvsSession,
  startZeroTrustSession,
  structureEvent,
  triggerPlaybook,
  verifyAttestation,
  verifySlsaLevel,
  verifySri,
} from '../../src/semantics/index.js';

/**
 * State-guard / argument-guard / fallback tests for semantics-layer axes.
 *
 * Same pattern as orm / mobile packages — closes reachable state-machine
 * throw branches, argument validation branches, and providerEventName
 * `?? neutral` fallback. Does not touch defensive-only unreachable branches.
 */

describe('container-k8s state guards', () => {
  const cleanPod = {
    namespace: 'prod',
    runAsRoot: false,
    privileged: false,
    allowPrivilegeEscalation: false,
    hostNetwork: false,
    hostPid: false,
  };

  it('enforcePodSecurity throws when session is network-policy-applied', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    enforcePodSecurity(s, 'restricted', cleanPod);
    applyNetworkPolicy(s, {
      namespace: 'prod',
      podSelector: { app: 'api' },
      ingressFromNamespaces: [],
      egressToNamespaces: [],
    });
    expect(() => enforcePodSecurity(s, 'restricted', cleanPod)).toThrow(
      'session is network-policy-applied',
    );
  });

  it('restricted level flags allowPrivilegeEscalation', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    const step = enforcePodSecurity(s, 'restricted', {
      ...cleanPod,
      allowPrivilegeEscalation: true,
    });
    expect(step.metadata['passed']).toBe(false);
    expect(step.metadata['violationCount']).toBe(1);
  });

  it('restricted level flags hostNetwork', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    const step = enforcePodSecurity(s, 'restricted', {
      ...cleanPod,
      hostNetwork: true,
    });
    expect(step.metadata['passed']).toBe(false);
  });

  it('restricted level flags hostPid', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    const step = enforcePodSecurity(s, 'restricted', {
      ...cleanPod,
      hostPid: true,
    });
    expect(step.metadata['passed']).toBe(false);
  });

  it('baseline level flags privileged', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    const step = enforcePodSecurity(s, 'baseline', {
      ...cleanPod,
      privileged: true,
    });
    expect(step.metadata['passed']).toBe(false);
  });

  it('baseline level flags hostPid', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    const step = enforcePodSecurity(s, 'baseline', {
      ...cleanPod,
      hostPid: true,
    });
    expect(step.metadata['passed']).toBe(false);
  });

  it('decideAdmission throws when network policy not applied', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    enforcePodSecurity(s, 'restricted', cleanPod);
    expect(() =>
      decideAdmission(
        s,
        {
          operation: 'CREATE',
          resource: 'Pod',
          namespace: 'prod',
          labels: {},
        },
        { requireLabel: 'x', allowedNamespaces: ['prod'] },
      ),
    ).toThrow('network policy must be applied');
  });
});

describe('crypto-advanced argument guards', () => {
  it('signWithHsm throws on empty keyId', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(() =>
      signWithHsm(s, { keyId: '', digest: 'abc', algorithm: 'ECDSA-P256' }),
    ).toThrow('keyId must not be empty');
  });
});

describe('incident-response state guards', () => {
  it('classifySeverity throws when playbook not triggered', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    expect(() =>
      classifySeverity(s, {
        affectedUsers: 10,
        dataClassification: 'public',
        serviceDown: false,
      }),
    ).toThrow('playbook must be triggered');
  });

  it('classifies sev2 for serviceDown + medium user count', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    triggerPlaybook(s, { playbookId: 'pb', detectionSource: 'x', initialAlert: 'y' });
    classifySeverity(s, {
      affectedUsers: 500,
      dataClassification: 'internal',
      serviceDown: true,
    });
    expect(s.severity).toBe('sev2');
  });

  it('escalate throws when severity not classified', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    triggerPlaybook(s, { playbookId: 'pb', detectionSource: 'x', initialAlert: 'y' });
    expect(() =>
      escalate(s, { channels: ['pd'], onCallPrimary: 'a', onCallSecondary: null }),
    ).toThrow('severity must be classified');
  });

  it('escalate falls back to sev5 when severity is null (as any state)', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).state = 'severity-classified';
    const step = escalate(s, {
      channels: ['pd'],
      onCallPrimary: 'a',
      onCallSecondary: null,
    });
    expect(step.metadata['severity']).toBe('sev5');
  });

  it('captureForensics throws when escalation not complete', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    triggerPlaybook(s, { playbookId: 'pb', detectionSource: 'x', initialAlert: 'y' });
    classifySeverity(s, {
      affectedUsers: 100,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    expect(() =>
      captureForensics(s, { memoryDumpMb: 0, networkPcapMb: 0, diskImageGb: 0 }),
    ).toThrow('escalation must complete');
  });

  it('recordPostMortem throws when forensics not captured', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    triggerPlaybook(s, { playbookId: 'pb', detectionSource: 'x', initialAlert: 'y' });
    classifySeverity(s, {
      affectedUsers: 100,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    escalate(s, { channels: ['pd'], onCallPrimary: 'a', onCallSecondary: null });
    expect(() =>
      recordPostMortem(s, {
        rootCause: 'long enough root cause',
        contributingFactors: [],
        actionItems: ['x'],
      }),
    ).toThrow('forensics must be captured');
  });

  it('recordPostMortem falls back to sev5 when severity is null (as any state)', () => {
    const s = startIncidentSession({ target: 'istio', sessionId: 's' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).state = 'forensics-captured';
    const step = recordPostMortem(s, {
      rootCause: 'long enough root cause',
      contributingFactors: [],
      actionItems: ['x'],
    });
    expect(step.metadata['severity']).toBe('sev5');
  });
});

describe('siem-audit state guards', () => {
  const evt = {
    actor: 'a',
    action: 'l',
    target: 't',
    timestamp: 1,
    result: 'success' as const,
  };

  it('structureEvent throws when session is sealed', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    structureEvent(s, evt);
    sealEvents(s, { previousHash: 'root' });
    expect(() => structureEvent(s, evt)).toThrow('session is sealed');
  });

  it('correlate throws when retention not applied', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    structureEvent(s, evt);
    sealEvents(s, { previousHash: 'root' });
    expect(() =>
      correlate(s, { ruleId: 'r', requiredEventIds: ['evt-1'], windowMs: 60_000 }),
    ).toThrow('retention must be applied');
  });
});

describe('supply-chain state guards', () => {
  const level4 = {
    buildScriptedFromRepo: true,
    buildServiceIsTrustworthy: true,
    buildParameterizable: false,
    buildIsolated: true,
    provenanceExists: true,
    provenanceAuthenticated: true,
    provenanceServiceGenerated: true,
    provenanceNonFalsifiable: true,
  };

  it('verifySlsaLevel throws when not idle', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    verifySlsaLevel(s, level4);
    expect(() => verifySlsaLevel(s, level4)).toThrow('session is slsa-verified');
  });

  it('matchReproducibleBuild throws when SLSA level not verified', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    expect(() =>
      matchReproducibleBuild(s, {
        buildA_hash: 'a',
        buildB_hash: 'a',
        toolchainVersion: 'x',
      }),
    ).toThrow('SLSA level must be verified');
  });

  it('signProvenance throws when reproducible build not matched', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    verifySlsaLevel(s, level4);
    expect(() =>
      signProvenance(s, {
        builderId: 'x',
        materialsCount: 1,
        signatureAlgorithm: 'sigstore-cosign',
      }),
    ).toThrow('reproducible build must be matched');
  });

  it('verifyAttestation throws when provenance not signed', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    verifySlsaLevel(s, level4);
    matchReproducibleBuild(s, {
      buildA_hash: 'a',
      buildB_hash: 'a',
      toolchainVersion: 'x',
    });
    expect(() =>
      verifyAttestation(s, {
        attestationType: 'slsa-provenance',
        trustRootFingerprint: 'x',
        validSignatures: 1,
      }),
    ).toThrow('provenance must be signed');
  });
});

describe('web-vitals-security state guards', () => {
  it('verifySri throws when session is trusted-types-enforced', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    verifySri(s, { resourceUrl: '/x.js', integrity: 'sha256-abc', computedHash: 'abc' });
    enforceTrustedTypes(s, {
      policyNames: ['default'],
      requireForScript: true,
      reportOnly: false,
    });
    expect(() =>
      verifySri(s, {
        resourceUrl: '/y.js',
        integrity: 'sha256-def',
        computedHash: 'def',
      }),
    ).toThrow('session is trusted-types-enforced');
  });

  it('applyPermissionsPolicy throws when trusted types not enforced', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    expect(() =>
      applyPermissionsPolicy(s, {
        features: [{ name: 'camera', allowlist: 'none' }],
      }),
    ).toThrow('trusted types must be enforced');
  });

  it('enforceCrossOriginIsolation throws when permissions policy not applied (double check)', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    verifySri(s, { resourceUrl: '/x.js', integrity: 'sha256-abc', computedHash: 'abc' });
    enforceTrustedTypes(s, {
      policyNames: ['default'],
      requireForScript: true,
      reportOnly: false,
    });
    expect(() =>
      enforceCrossOriginIsolation(s, {
        coop: 'same-origin',
        coep: 'require-corp',
        corp: 'same-origin',
      }),
    ).toThrow('permissions policy must be applied');
  });
});

describe('zero-trust state guards', () => {
  it('requestJit throws when risk not scored', () => {
    const s = startZeroTrustSession({ target: 'opa', sessionId: 's' });
    expect(() =>
      requestJit(s, {
        requestedRole: 'admin',
        justification: 'long enough reason',
        ttlSeconds: 300,
      }),
    ).toThrow('risk must be scored');
  });
});

describe('providerAdvEventName ?? neutral fallback', () => {
  it('returns the neutral event name when dialect entry is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unknown = 'unknown.axis.event' as any;
    const result = providerAdvEventName('istio', unknown);
    expect(result).toBe('unknown.axis.event');
  });
});

describe('resolveAdvRealDriver env default fallback', () => {
  it('uses process.env when input.env is not provided', () => {
    const saved = process.env.KIWA_MODE;
    delete process.env.KIWA_MODE;
    try {
      const r = resolveAdvRealDriver({ provider: 'istio' });
      expect(r.useRealDriver).toBe(false);
      expect(r.reason).toContain('KIWA_MODE!=real');
    } finally {
      if (saved !== undefined) {
        process.env.KIWA_MODE = saved;
      }
    }
  });
});

describe('applyRetention state guard reachable via public API', () => {
  it('throws when applyRetention called before seal', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's' });
    structureEvent(s, {
      actor: 'a',
      action: 'l',
      target: 't',
      timestamp: 1,
      result: 'success' as const,
    });
    // still structured, not sealed
    expect(() =>
      applyRetention(s, {
        hotDays: 1,
        warmDays: 1,
        coldDays: 1,
        legalHold: false,
      }),
    ).toThrow('sealed first');
  });
});
