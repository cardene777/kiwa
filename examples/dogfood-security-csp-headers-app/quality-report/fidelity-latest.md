# Quality Report — @kiwa-test/security/dogfood-csp-headers-app @ 0.1.0

_Reported at 2026-07-07T02:56:51.802Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 87.00% |
| coverage — function | 94.00% |
| test count — total | 50 |
| test count — behavior | 42 |
| test count — integration | 5 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (15/15) |
| fidelity — behavioralDivergences | 15 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 3 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 15 divergences across 15 ops:
- startCsp: BEHAVIORAL_DIVERGENCE
- attachNonce: BEHAVIORAL_DIVERGENCE
- attachHash: BEHAVIORAL_DIVERGENCE
- applyStrictDynamic: BEHAVIORAL_DIVERGENCE
- applyTrustedTypes: BEHAVIORAL_DIVERGENCE
- emitCspHeader: BEHAVIORAL_DIVERGENCE
- startViolation: BEHAVIORAL_DIVERGENCE
- ingestViolation: BEHAVIORAL_DIVERGENCE
- recordViolationEvent: BEHAVIORAL_DIVERGENCE
- closeViolation: BEHAVIORAL_DIVERGENCE
- startHeaders: BEHAVIORAL_DIVERGENCE
- applyHsts: BEHAVIORAL_DIVERGENCE
- applyReferrerPolicy: BEHAVIORAL_DIVERGENCE
- applyPermissionsPolicy: BEHAVIORAL_DIVERGENCE
- emitHeaderBundle: BEHAVIORAL_DIVERGENCE
