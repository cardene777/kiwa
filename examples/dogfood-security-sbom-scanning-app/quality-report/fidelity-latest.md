# Quality Report — @kiwa/security/dogfood-sbom-scanning-app @ 0.1.0

_Reported at 2026-07-07T03:29:45.088Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 87.00% |
| coverage — function | 94.00% |
| test count — total | 65 |
| test count — behavior | 55 |
| test count — integration | 6 |
| test count — e2e | 4 |
| fidelity — ratio | 100.00% (14/14) |
| fidelity — behavioralDivergences | 14 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 12 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 14 divergences across 14 ops:
- startSbom: BEHAVIORAL_DIVERGENCE
- addComponent: BEHAVIORAL_DIVERGENCE
- emitCycloneDx: BEHAVIORAL_DIVERGENCE
- emitSpdx: BEHAVIORAL_DIVERGENCE
- validateSbom: BEHAVIORAL_DIVERGENCE
- evaluateLicense: BEHAVIORAL_DIVERGENCE
- closeSbom: BEHAVIORAL_DIVERGENCE
- startSecrets: BEHAVIORAL_DIVERGENCE
- scanSource: BEHAVIORAL_DIVERGENCE
- trackRotation: BEHAVIORAL_DIVERGENCE
- markRotated: BEHAVIORAL_DIVERGENCE
- lookupAdvisories: BEHAVIORAL_DIVERGENCE
- buildReport: BEHAVIORAL_DIVERGENCE
- closeSecrets: BEHAVIORAL_DIVERGENCE
