import { describe, expect, it } from 'vitest';
import {
  matchReproducibleBuild,
  signProvenance,
  startSupplyChainSession,
  verifyAttestation,
  verifySlsaLevel,
} from '../../src/semantics/index.js';

describe('startSupplyChainSession', () => {
  it('creates idle session', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    expect(s.state).toBe('idle');
    expect(s.verifiedLevel).toBe(0);
  });

  it('throws when sessionId is empty', () => {
    expect(() =>
      startSupplyChainSession({ target: 'siem-splunk', sessionId: '' }),
    ).toThrow('sessionId must not be empty');
  });
});

describe('verifySlsaLevel', () => {
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

  it('reaches level 4 with all controls', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    const step = verifySlsaLevel(s, level4);
    expect(s.verifiedLevel).toBe(4);
    expect(step.metadata['level']).toBe(4);
  });

  it('reaches level 3 when parameterizable', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    verifySlsaLevel(s, { ...level4, buildParameterizable: true });
    expect(s.verifiedLevel).toBe(3);
  });

  it('reaches level 2 when not isolated', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    verifySlsaLevel(s, {
      ...level4,
      buildIsolated: false,
      provenanceNonFalsifiable: false,
    });
    expect(s.verifiedLevel).toBe(2);
  });

  it('reaches level 1 with base scripting only', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    verifySlsaLevel(s, {
      ...level4,
      buildServiceIsTrustworthy: false,
      provenanceAuthenticated: false,
      provenanceServiceGenerated: false,
    });
    expect(s.verifiedLevel).toBe(1);
  });

  it('stays at level 0 without provenance', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    verifySlsaLevel(s, {
      ...level4,
      provenanceExists: false,
      buildScriptedFromRepo: false,
    });
    expect(s.verifiedLevel).toBe(0);
  });

  it('transitions state to slsa-verified', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    verifySlsaLevel(s, level4);
    expect(s.state).toBe('slsa-verified');
  });
});

describe('matchReproducibleBuild', () => {
  const setup = (s: ReturnType<typeof startSupplyChainSession>) =>
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

  it('matches identical hashes', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    setup(s);
    const step = matchReproducibleBuild(s, {
      buildA_hash: 'sha256:abc',
      buildB_hash: 'sha256:abc',
      toolchainVersion: 'rustc-1.75',
    });
    expect(step.metadata['matched']).toBe(true);
    expect(s.state).toBe('reproducible-matched');
  });

  it('does not match different hashes', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    setup(s);
    const step = matchReproducibleBuild(s, {
      buildA_hash: 'sha256:abc',
      buildB_hash: 'sha256:def',
      toolchainVersion: 'rustc-1.75',
    });
    expect(step.metadata['matched']).toBe(false);
  });

  it('rejects empty hashes', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    setup(s);
    expect(() =>
      matchReproducibleBuild(s, {
        buildA_hash: '',
        buildB_hash: 'sha256:def',
        toolchainVersion: 'x',
      }),
    ).toThrow('must not be empty');
  });
});

describe('signProvenance', () => {
  const setup = (s: ReturnType<typeof startSupplyChainSession>) => {
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
      toolchainVersion: 'x',
    });
  };

  it('signs with sigstore-cosign', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    setup(s);
    const step = signProvenance(s, {
      builderId: 'https://github.com/actions',
      materialsCount: 42,
      signatureAlgorithm: 'sigstore-cosign',
    });
    expect(step.metadata['signatureAlgorithm']).toBe('sigstore-cosign');
    expect(s.state).toBe('provenance-signed');
  });

  it('supports in-toto and gpg', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    setup(s);
    signProvenance(s, {
      builderId: 'gpg-user',
      materialsCount: 0,
      signatureAlgorithm: 'gpg',
    });
    expect(s.state).toBe('provenance-signed');
  });

  it('rejects empty builderId', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    setup(s);
    expect(() =>
      signProvenance(s, {
        builderId: '',
        materialsCount: 1,
        signatureAlgorithm: 'sigstore-cosign',
      }),
    ).toThrow('builderId must not be empty');
  });

  it('rejects negative materials', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    setup(s);
    expect(() =>
      signProvenance(s, {
        builderId: 'x',
        materialsCount: -1,
        signatureAlgorithm: 'sigstore-cosign',
      }),
    ).toThrow('non-negative');
  });
});

describe('verifyAttestation', () => {
  const setup = (s: ReturnType<typeof startSupplyChainSession>) => {
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
      toolchainVersion: 'x',
    });
    signProvenance(s, {
      builderId: 'gh',
      materialsCount: 5,
      signatureAlgorithm: 'sigstore-cosign',
    });
  };

  it('verifies slsa-provenance attestation', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    setup(s);
    const step = verifyAttestation(s, {
      attestationType: 'slsa-provenance',
      trustRootFingerprint: 'sha256:root',
      validSignatures: 2,
    });
    expect(step.metadata['validSignatures']).toBe(2);
    expect(s.state).toBe('attestation-verified');
  });

  it('supports spdx-sbom and cyclone-dx-vex', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    setup(s);
    verifyAttestation(s, {
      attestationType: 'spdx-sbom',
      trustRootFingerprint: 'x',
      validSignatures: 1,
    });
    expect(s.state).toBe('attestation-verified');
  });

  it('rejects empty trust root', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    setup(s);
    expect(() =>
      verifyAttestation(s, {
        attestationType: 'slsa-provenance',
        trustRootFingerprint: '',
        validSignatures: 1,
      }),
    ).toThrow('trustRootFingerprint must not be empty');
  });

  it('rejects zero signatures', () => {
    const s = startSupplyChainSession({ target: 'siem-splunk', sessionId: 's' });
    setup(s);
    expect(() =>
      verifyAttestation(s, {
        attestationType: 'slsa-provenance',
        trustRootFingerprint: 'x',
        validSignatures: 0,
      }),
    ).toThrow('at least one valid signature');
  });
});
