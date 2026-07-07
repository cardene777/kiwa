# dogfood-security-mtls-zero-trust-app (v1.39-2)

An Istio + OPA style mutual-TLS + Zero-trust access broker that drives mTLS (handshake + SPKI certificate pinning + OCSP stapling + Certificate Transparency log check) + Zero-trust (device posture + risk scoring + Just-in-Time access + micro-segmentation) + broker (fused mtls + zero-trust decision) across a provider-neutral `SecurityAdapter`. Both mock (`@kiwa-test/security` v0.2 mtls + zero-trust semantics) and real (Istio + OPA broker driver when `MTLS_STACK_READY=1` + `KIWA_MTLS_CA_PATH` + `KIWA_ISTIO_URL` + `KIWA_OPA_URL` are set) implementations satisfy the same 15-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-security-mtls-zero-trust-app test
pnpm --filter dogfood-security-mtls-zero-trust-app test:e2e
```

The vitest suite drives the mock adapter through the same mtls / zero-trust / broker handlers the runtime mounts in production. The Playwright suite additionally spawns a BrowserContext against a minimal HTTP server so real browser origin regression is captured.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export MTLS_STACK_READY=1
export KIWA_MTLS_CA_PATH=/etc/kiwa/mtls/ca.pem
export KIWA_ISTIO_URL=https://istiod.istio-system.svc:15014
export KIWA_OPA_URL=https://opa.opa-system.svc:8181
pnpm --filter dogfood-security-mtls-zero-trust-app test
```

The real adapter defers the Istio + OPA broker driver wiring to a follow-up milestone. Until `MTLS_STACK_READY=1` + `KIWA_MTLS_CA_PATH` + `KIWA_ISTIO_URL` + `KIWA_OPA_URL` are set (which every non-integration environment leaves unset), every real op refuses with `KIWA_MTLS_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`SecurityAdapter` covers 15 ops across 3 domain surfaces + 2 axes.

- **mtls surface (mtls axis: handshake + pin + OCSP + CT log)**
  - `startMtls` — begin an mTLS session bound to a provider target (istio / opa / siem-splunk / vault)
  - `completeHandshake` — complete a TLS 1.2 / 1.3 handshake with a peer CN + cipher suite
  - `verifyPin` — check that the peer's SPKI SHA-256 matches an expected pin
  - `verifyOcsp` — verify the OCSP staple (must be present + good)
  - `checkCtLog` — assert the certificate has at least `minSctRequired` SCTs in the CT log
  - `closeMtls` — finalize the session (subsequent ops raise)
- **zero-trust surface (zero-trust axis: posture + risk + JIT + segment)**
  - `startZeroTrust` — begin a zero-trust session bound to a provider target
  - `evaluatePosture` — return passed=true iff all four device signals (OS / disk / EDR / MDM) are true
  - `scoreRisk` — sum weighted contributions (unusualLocation 25 + unusualTime 15 + newDevice 20 + threatIntelHit 40)
  - `requestJit` — grant when riskScore < 50; enforce TTL 1..3600 + justification >= 10 chars
  - `enforceMicroSegment` — allowed=true iff the requested peer is in the allowed list
  - `closeZeroTrust` — finalize the session
- **broker surface (broker axis: fused mtls + zero-trust decision)**
  - `startBroker` — begin a broker session bound to an mtls target + zt target
  - `decideBroker` — admit iff both mtlsOk and ztOk are true; otherwise return a granular reason (mtls_denied / zt_denied / mtls_and_zt_denied)
  - `closeBroker` — finalize the broker session

## Fidelity report

The vitest suite writes `quality-report/fidelity-latest.md` + `quality-report/fidelity-latest.json` that `@kiwa-test/quality-metrics` picks up for the 13-axis release gate.
