# Quality Report — @kiwa-lab/observability/dogfood-chaos-aiops-app @ 2.2.0

_Reported at 2026-07-07T15:21:09.329Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 87.00% |
| coverage — function | 94.00% |
| test count — total | 55 |
| test count — behavior | 50 |
| test count — integration | 4 |
| test count — e2e | 1 |
| fidelity — ratio | 100.00% (12/12) |
| fidelity — behavioralDivergences | 12 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 6 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 12 divergences across 12 ops:
- startChaos: BEHAVIORAL_DIVERGENCE
- injectFault: BEHAVIORAL_DIVERGENCE
- triggerRollback: BEHAVIORAL_DIVERGENCE
- closeChaos: BEHAVIORAL_DIVERGENCE
- startRemediation: BEHAVIORAL_DIVERGENCE
- detectAnomaly: BEHAVIORAL_DIVERGENCE
- executeRemediation: BEHAVIORAL_DIVERGENCE
- closeRemediation: BEHAVIORAL_DIVERGENCE
- startRca: BEHAVIORAL_DIVERGENCE
- analyzeRootCause: BEHAVIORAL_DIVERGENCE
- correlateAlerts: BEHAVIORAL_DIVERGENCE
- closeRca: BEHAVIORAL_DIVERGENCE
