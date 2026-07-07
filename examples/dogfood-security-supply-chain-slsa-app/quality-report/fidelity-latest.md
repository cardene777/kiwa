# Quality Report — @kiwa-test/security/dogfood-supply-chain-slsa-app @ 0.2.0

_Reported at 2026-07-07T07:37:44.772Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 87.00% |
| coverage — function | 94.00% |
| test count — total | 68 |
| test count — behavior | 60 |
| test count — integration | 5 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (13/13) |
| fidelity — behavioralDivergences | 13 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 5 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 13 divergences across 13 ops:
- startSlsa: BEHAVIORAL_DIVERGENCE
- verifySlsaLevel: BEHAVIORAL_DIVERGENCE
- closeSlsa: BEHAVIORAL_DIVERGENCE
- startReproducible: BEHAVIORAL_DIVERGENCE
- matchReproducibleBuild: BEHAVIORAL_DIVERGENCE
- closeReproducible: BEHAVIORAL_DIVERGENCE
- startAttestation: BEHAVIORAL_DIVERGENCE
- signProvenance: BEHAVIORAL_DIVERGENCE
- verifyAttestation: BEHAVIORAL_DIVERGENCE
- closeAttestation: BEHAVIORAL_DIVERGENCE
- startOrchestrator: BEHAVIORAL_DIVERGENCE
- orchestrateDecision: BEHAVIORAL_DIVERGENCE
- closeOrchestrator: BEHAVIORAL_DIVERGENCE
