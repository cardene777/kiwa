# Supply chain SLSA — level verification + reproducible build + signed provenance + attestation in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/security` v0.2 that models the 4 signals of a real supply chain SLSA chain that every non-trivial build pipeline eventually needs — a SLSA level classifier that walks 8 booleans (build-scripted-from-repo + build-service-is-trustworthy + build-parameterizable + build-isolated + provenance-exists + provenance-authenticated + provenance-service-generated + provenance-non-falsifiable) into a 0..4 level so a CI-driven build cannot silently claim SLSA 3 without the isolation + non-falsifiable provenance signals, a reproducible-build matcher that compares two build hashes and pins the toolchain version so a `nixpkgs` rev bump or a `node --version` drift shows up as `matched: false`, a provenance signer that records the builder id + materials count + signature algorithm (`sigstore-cosign` / `in-toto` / `gpg`), and an attestation verifier that requires a trust-root fingerprint + at least one valid signature and pins the attestation type (`slsa-provenance` / `spdx-sbom` / `cyclone-dx-vex`). `startSupplyChainSession()` + `verifySlsaLevel()` + `matchReproducibleBuild()` + `signProvenance()` + `verifyAttestation()` give you every one of those signals without booting a real sigstore or in-toto attestation engine. This is the pattern kiwa's `examples/dogfood-security-supply-chain-slsa-app` exercises against real sigstore + in-toto under `KIWA_MODE=real` + `KIWA_VAULT_URL`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the build claimed SLSA 3 but the isolation signal was `false` and the CI operator only noticed after a downstream consumer rejected the attestation" gap a reviewer sees in the supply chain post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-supply-chain && cd kiwa-supply-chain
pnpm init
pnpm add -D @kiwa-lab/security@^0.2 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.2 surface exports the supply chain axis (`startSupplyChainSession` / `verifySlsaLevel` / `matchReproducibleBuild` / `signProvenance` / `verifyAttestation`) directly from the package root. This tutorial walks the full chain end-to-end so a downstream consumer of a package build can independently verify the SLSA claim.

### 2. `startSupplyChainSession` + `verifySlsaLevel` — the 8-signal level classifier

`tests/supply-chain/level.test.ts` — a `SupplyChainSession` pins a `target` (`istio` / `opa` / `siem-splunk` / `vault`) + `sessionId` + a `state` that starts at `idle` and walks `slsa-verified` → `reproducible-matched` → `provenance-signed` → `attestation-verified`. `verifySlsaLevel()` walks the 8 boolean signals into a 0..4 level — the level classifier follows the SLSA v0.1 spec (Google Open Source Insights) so a downstream verifier can consume the claim without renaming.

- Level 1 needs `buildScriptedFromRepo` + `provenanceExists`
- Level 2 needs level 1 + `buildServiceIsTrustworthy` + `provenanceAuthenticated` + `provenanceServiceGenerated`
- Level 3 needs level 2 + `buildIsolated` + `provenanceNonFalsifiable`
- Level 4 needs level 3 + `buildParameterizable === false`

```ts
import { describe, expect, it } from 'vitest';
import {
  startSupplyChainSession,
  verifySlsaLevel,
} from '@kiwa-lab/security';

describe('supply-chain — verifySlsaLevel', () => {
  it('classifies a fully-signed isolated non-parameterized build as SLSA 4', () => {
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

  it('classifies a level 3 build that is still parameterizable (parameterizable blocks level 4)', () => {
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

  it('classifies a level 2 build that is missing isolation (isolation gate for level 3)', () => {
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

  it('classifies a build with no provenance as SLSA 0 (fallback)', () => {
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
```

The strict per-level gate is what stops a build pipeline from silently over-claiming — a CI that flips `buildServiceIsTrustworthy: false` because a self-hosted runner replaced the trusted GitHub-hosted runner drops the level from 2 to 1, and the downstream verifier sees the drop instead of a stale "SLSA 2" badge.

### 3. `matchReproducibleBuild` — same source, same toolchain, same hash

`tests/supply-chain/reproducible.test.ts` — `matchReproducibleBuild()` compares two independently-produced build hashes (`buildA_hash` + `buildB_hash`) and pins the toolchain version so a `nixpkgs` rev bump or a `node --version` drift shows up as `matched: false`. The empty-hash guard is the "silent no-op" trap — a matcher that returns true for two empty strings would blur the invariant.

```ts
import { describe, expect, it } from 'vitest';
import {
  matchReproducibleBuild,
  startSupplyChainSession,
  verifySlsaLevel,
} from '@kiwa-lab/security';

describe('supply-chain — matchReproducibleBuild', () => {
  it('emits matched=true when two independent builds produce the same hash', () => {
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

  it('emits matched=false when build hashes drift (toolchain rev bump caught)', () => {
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

  it('refuses empty hashes (guards against silent no-op)', () => {
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
```

Reproducible builds are the "same input, same output" invariant that makes SLSA claims independently verifiable — without reproducibility, the provenance signature only proves who built it, not that anyone else can rebuild the same artifact.

### 4. `signProvenance` — builder id + materials count + signature algorithm

`tests/supply-chain/provenance.test.ts` — `signProvenance()` accepts a `builderId` + `materialsCount` + `signatureAlgorithm` (`sigstore-cosign` / `in-toto` / `gpg`) and pins the shape SLSA v0.1 provenance format uses. The `builderId` must be non-empty (an unnamed builder is a missing SSOT), and `materialsCount` must be non-negative (a negative count is a config typo). The three signature algorithms cover the industry-standard signing paths.

```ts
import { describe, expect, it } from 'vitest';
import {
  matchReproducibleBuild,
  signProvenance,
  startSupplyChainSession,
  verifySlsaLevel,
} from '@kiwa-lab/security';

describe('supply-chain — signProvenance', () => {
  it('records builder id + materials count + sigstore-cosign algorithm', () => {
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

  it('accepts in-toto and gpg as alternate signing algorithms', () => {
    const s1 = startSupplyChainSession({ target: 'vault', sessionId: 's-1' });
    verifySlsaLevel(s1, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    matchReproducibleBuild(s1, {
      buildA_hash: 'sha256:abc',
      buildB_hash: 'sha256:abc',
      toolchainVersion: 'nixpkgs-24.05',
    });
    const step1 = signProvenance(s1, {
      builderId: 'nix-builder',
      materialsCount: 12,
      signatureAlgorithm: 'in-toto',
    });
    expect(step1.metadata.signatureAlgorithm).toBe('in-toto');

    const s2 = startSupplyChainSession({ target: 'vault', sessionId: 's-2' });
    verifySlsaLevel(s2, {
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: false,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      provenanceNonFalsifiable: true,
    });
    matchReproducibleBuild(s2, {
      buildA_hash: 'sha256:abc',
      buildB_hash: 'sha256:abc',
      toolchainVersion: 'nixpkgs-24.05',
    });
    const step2 = signProvenance(s2, {
      builderId: 'legacy-gpg-keyring',
      materialsCount: 3,
      signatureAlgorithm: 'gpg',
    });
    expect(step2.metadata.signatureAlgorithm).toBe('gpg');
  });

  it('refuses an empty builder id (guards against unnamed builder)', () => {
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
```

The `builderId` is the SSOT connection between the provenance signature and the CI job that produced the artifact — a downstream verifier consumes the exact same id to look up the trust root.

### 5. `verifyAttestation` — trust-root + valid signatures + attestation type

`tests/supply-chain/attestation.test.ts` — `verifyAttestation()` accepts an `attestationType` (`slsa-provenance` / `spdx-sbom` / `cyclone-dx-vex`) + `trustRootFingerprint` + `validSignatures: number` and pins the SLSA / SPDX / CycloneDX-VEX attestation shapes. The `validSignatures` count must be at least 1 — an attestation with zero valid signatures is not verified, it is unsigned.

```ts
import { describe, expect, it } from 'vitest';
import {
  matchReproducibleBuild,
  signProvenance,
  startSupplyChainSession,
  verifyAttestation,
  verifySlsaLevel,
} from '@kiwa-lab/security';

describe('supply-chain — verifyAttestation', () => {
  it('records attestation type + trust root + valid signature count', () => {
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

  it('accepts spdx-sbom and cyclone-dx-vex as alternate attestation types', () => {
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

  it('refuses zero valid signatures (guards against unsigned attestation)', () => {
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
```

The 3 attestation types cover the industry-standard artifact metadata paths (SLSA provenance / SPDX SBOM / CycloneDX-VEX for vulnerability exchange) so a downstream verifier consumes the same shape regardless of which upstream builder produced it.

## Run the test suite

```bash
pnpm test
```

Vitest reports every describe block above. The v0.2 supply chain axis surface — `startSupplyChainSession` + `verifySlsaLevel` + `matchReproducibleBuild` + `signProvenance` + `verifyAttestation` — has 30+ tests in `packages/security/tests/supply-chain.test.ts`; this tutorial covers the everyday chain that lands in a real sigstore + in-toto pipeline.

## What's next

- The `security-advanced-II-testing.md` concept doc is the SSOT for the v0.2 8-axis / 4-provider / 32-cell grid — read that once to understand where the 4 axes (mTLS + Zero-trust from tutorial 82, SIEM audit + Incident response from tutorial 83, Supply chain SLSA from this tutorial) sit in the larger security posture picture.
- The v1.39-1 landing brief covers the remaining 3 axes (Cryptography advanced, Container / K8s security, Web Vitals security) at the API level; the tutorial coverage for those axes is deferred to a later milestone.
- v1.39 does not add a 14th release-gate axis; the 8 v0.2 axes gate the security package's own tests but do not surface as a per-package `quality-metrics` axis (same reasoning as the v1.37 v0.1 axes).
