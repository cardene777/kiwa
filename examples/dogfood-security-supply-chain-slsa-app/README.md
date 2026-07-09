# dogfood-security-supply-chain-slsa-app (v1.39-4)

An in-toto + sigstore + cosign style supply chain security orchestrator that drives SLSA level 0-4 gate + reproducible build hash matching + signed provenance (builder + material set + signature algorithm) + attestation policy verification (attestation type + trust root fingerprint + valid signature count) + orchestrator (fused SLSA level gate → reproducible → provenance → attestation policy pipeline) across a provider-neutral `SecurityAdapter`. Both mock (`@kiwa-lab/security` v0.2 supply-chain semantics) and real (cosign + rekor + in-toto driver when `COSIGN_STACK_READY=1` + `KIWA_COSIGN_BIN` + `KIWA_IN_TOTO_URL` + `KIWA_REKOR_URL` + `KIWA_COSIGN_TRUST_ROOT` are set) implementations satisfy the same 13-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-security-supply-chain-slsa-app test
pnpm --filter dogfood-security-supply-chain-slsa-app test:e2e
```

The vitest suite drives the mock adapter through the same supply-chain / reproducible / attestation / sc-orchestrator handlers the runtime mounts in production. The Playwright suite additionally spawns a BrowserContext against a minimal HTTP server so real browser origin regression is captured.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export COSIGN_STACK_READY=1
export KIWA_COSIGN_BIN=/usr/local/bin/cosign
export KIWA_IN_TOTO_URL=https://in-toto.example.com/verify
export KIWA_REKOR_URL=https://rekor.sigstore.dev
export KIWA_COSIGN_TRUST_ROOT=sha256:trust-root-fingerprint-abc
pnpm --filter dogfood-security-supply-chain-slsa-app test
```

The real adapter defers the cosign sign + rekor upload + in-toto attest ceremony to a follow-up milestone. Until `COSIGN_STACK_READY=1` + `KIWA_COSIGN_BIN` + `KIWA_IN_TOTO_URL` + `KIWA_REKOR_URL` + `KIWA_COSIGN_TRUST_ROOT` are set (which every non-integration environment leaves unset), every real op refuses with `KIWA_COSIGN_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`SecurityAdapter` covers 13 ops across 4 domain surfaces.

- **supply-chain surface (slsa-e2e axis: SLSA level 0-4 gate)**
  - `startSlsa` — begin an SLSA supply-chain session bound to a provider target (istio / opa / siem-splunk / vault)
  - `verifySlsaLevel` — walk the SLSA 0-4 ladder based on 8 boolean gate inputs (build scripted from repo + build service trustworthy + parameterizable + isolated + provenance exists + authenticated + service-generated + non-falsifiable)
  - `closeSlsa` — finalize the session
- **reproducible surface (reproducible-e2e axis: twin hash match + toolchain pinning)**
  - `startReproducible` — begin a reproducible build session bound to a provider target
  - `matchReproducibleBuild` — assert twin build hashes agree and thread the toolchain version through unchanged
  - `closeReproducible` — finalize the session
- **attestation surface (attestation-e2e axis: signed provenance + verified attestation)**
  - `startAttestation` — begin a provenance + attestation session bound to a provider target
  - `signProvenance` — bind builderId + materialsCount + signature algorithm (`sigstore-cosign` / `in-toto` / `gpg`) on the session
  - `verifyAttestation` — verify an attestation payload (`slsa-provenance` / `spdx-sbom` / `cyclone-dx-vex`) with a trust root fingerprint + valid signature count
  - `closeAttestation` — finalize the session
- **orchestrator surface (orchestrator-e2e axis: fused policy pipeline)**
  - `startOrchestrator` — begin a fused session bound to slsaTarget + reproducibleTarget + attestationTarget
  - `orchestrateDecision` — decide `policyPassed` from `slsaLevel` + `reproducibleMatched` + `provenanceSigned` + (`attestationVerified` when `requireAttestation=true`) + `minRequiredLevel`
  - `closeOrchestrator` — finalize the session

## Fidelity harness

`runFidelityHarness()` diffs the mock and real trace event streams and feeds the divergence count into `@kiwa-lab/quality-metrics` release gate. Behavioral divergences are expected on non-integration environments — the real adapter refuses every op with `KIWA_COSIGN_ENV_MISSING`, and the mock adapter succeeds, so every op appears in the divergence list. The harness treats those as `BEHAVIORAL_DIVERGENCE` records so the release-gate row can distinguish "not configured" from "ran and diverged".

The report writes both markdown and JSON into `./quality-report/`, which the release script picks up alongside every other axis dogfood.
