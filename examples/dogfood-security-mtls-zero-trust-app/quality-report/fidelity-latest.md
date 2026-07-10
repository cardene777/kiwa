# Quality Report — @kiwa-lab/security/dogfood-mtls-zero-trust-app @ 0.2.0

_Reported at 2026-07-10T04:15:39.691Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 87.00% |
| coverage — function | 94.00% |
| test count — total | 63 |
| test count — behavior | 55 |
| test count — integration | 5 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (15/15) |
| fidelity — behavioralDivergences | 15 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 9 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 15 divergences across 15 ops:
- startMtls: BEHAVIORAL_DIVERGENCE
- completeHandshake: BEHAVIORAL_DIVERGENCE
- verifyPin: BEHAVIORAL_DIVERGENCE
- verifyOcsp: BEHAVIORAL_DIVERGENCE
- checkCtLog: BEHAVIORAL_DIVERGENCE
- closeMtls: BEHAVIORAL_DIVERGENCE
- startZeroTrust: BEHAVIORAL_DIVERGENCE
- evaluatePosture: BEHAVIORAL_DIVERGENCE
- scoreRisk: BEHAVIORAL_DIVERGENCE
- requestJit: BEHAVIORAL_DIVERGENCE
- enforceMicroSegment: BEHAVIORAL_DIVERGENCE
- closeZeroTrust: BEHAVIORAL_DIVERGENCE
- startBroker: BEHAVIORAL_DIVERGENCE
- decideBroker: BEHAVIORAL_DIVERGENCE
- closeBroker: BEHAVIORAL_DIVERGENCE
