# Auth advanced III testing — v0.6 8 axis SSOT

## What this covers

`@kiwa/auth` v0.6 layers 8 advanced Passwordless UX axes on top of the v0.4 / v0.5 base (4 protocol adapter = WebAuthn L3 + Passkey + OAuth 2.1 + OIDC). Each new axis models a semantic that browsers implement differently — device binding, conditional UI, step-up MFA, risk-based auth, auth continuity, cross-device flow, session hijack detection, and auth telemetry. This document is the SSOT for the 8 axes, the 3-platform fidelity grid (chromium / webkit / firefox), and the pair 第 1 pair 3 段拡張達成 record.

## Pair 第 1 pair 3 段拡張達成

v1.44 achieves the **1st 縦深化 pair 3 段拡張** (Auth base → v1.22 II → v1.44 III). This is the second pair to reach depth 3 (after Search v1.14→v1.15→v1.36), demonstrating that the 3-stage extension pattern is reproducible after the 4-stage depth-4 record was established (v1.40 AI/LLM / v1.41 Payment / v1.42 Observability).

## The 8 v0.6 advanced Passwordless UX axes

### device-bound-passkey axis

`startDevicePasskey` + `bindToDevice` + `verifySyncFabric` + `migrateCredential` + `confirmCredProps`. Models device-bound vs synced passkeys (Chrome Sync / iCloud Keychain / Firefox Sync ergonomics).

### conditional-ui axis

`startConditionalUi` + `showHint` + `selectAutofill` + `triggerFallback` + `markTimeout`. Models WebAuthn L3 `mediation: "conditional"` autofill flows on 3 browsers.

### step-up-mfa axis

`startStepUp` + `requestEscalation` + `satisfyAal2` + `satisfyAal3` + `checkTrustCache`. Models NIST SP 800-63B AAL1 → AAL2 → AAL3 escalation ladder + trust duration cache.

### risk-based-auth axis

`startRiskEval` + `evaluateScore` + `injectChallenge` + `applyPolicy`. Models signal aggregation (device + IP + geo + velocity + behavioral) → adaptive challenge → allow/block policy.

### auth-continuity axis

`startContinuity` + `seamlessReauth` + `rotateRefresh` + `extendSession` + `hitRevocationWindow`. Models RFC 6749 §10.4 refresh token rotation + revocation window.

### cross-device-flow axis

`startCrossDevice` + `generateQr` + `pairBle` + `openTunnel` + `completeHandshake`. Models CTAP2 hybrid transport (caBLE) desktop-with-phone flow.

### session-hijack-detect axis

`startHijackWatch` + `reportFingerprintDrift` + `reportGeoAnomaly` + `reportConcurrentSession` + `triggerLogoutCascade`. Models per-session anomaly signals + cascade logout on confirmed hijack.

### auth-telemetry axis

`startAuthTelemetry` + `recordAttempt` + `updateSuccessRate` + `bucketLatency` + `detectAbuse`. Models operational metrics + abuse detection based on failure rate.

## 3-platform × 8-axis fidelity grid

`collectFidelityCoverage(['chromium', 'webkit', 'firefox'])` produces 24 rows (3 platform × 8 axis). Each row carries the neutral event list and browser-dialect map — e.g. device-bound-passkey axis maps `passkey.sync-fabric-verified` to `chrome_sync.passkey_verified` on chromium, `icloud_keychain.verified` on webkit, `ff_sync.passkey_verified` on firefox.

## Dogfood app real-driver env-gate

3 dogfood apps ship in v1.44 — one per operational cluster of axes.

- `examples/dogfood-auth-passwordless-ux-app` — device-bound + conditional-ui + cross-device. `KIWA_MODE=real` + `AUTH_PASSWORDLESS_STACK_READY=1` + `KIWA_AUTH_PASSWORDLESS_URL` triggers real browser+WebAuthn stack.
- `examples/dogfood-auth-step-up-mfa-app` — step-up + continuity + hijack. `KIWA_MODE=real` + `AUTH_STEP_UP_STACK_READY=1` + `KIWA_AUTH_STEP_UP_URL`.
- `examples/dogfood-auth-risk-based-app` — risk + telemetry + hijack (concurrent + geo variant). `KIWA_MODE=real` + `AUTH_RISK_BASED_STACK_READY=1` + `KIWA_AUTH_RISK_BASED_URL`.

Each dogfood runs the fidelity harness across 9 scenarios (3 platform × 3 stage) and reports mock-vs-real trace drift.

## Related concepts

- `real-driver-testing.md` (SSOT for `KIWA_MODE=real` env-gate pattern)
- `edge-serverless-advanced-testing.md` (v1.43 pair 第 12 new base pair introduction)
- `observability-advanced-III-testing.md` (v1.42 pair 第 11 depth-4 achievement)
- `release-invariants.md` (v1.29 3-layer defensive structure)
