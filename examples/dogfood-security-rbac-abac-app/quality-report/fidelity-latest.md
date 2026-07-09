# Quality Report — @kiwa-lab/security/dogfood-rbac-abac-app @ 0.1.0

_Reported at 2026-07-07T03:13:23.534Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 87.00% |
| coverage — function | 94.00% |
| test count — total | 70 |
| test count — behavior | 60 |
| test count — integration | 6 |
| test count — e2e | 4 |
| fidelity — ratio | 100.00% (15/15) |
| fidelity — behavioralDivergences | 15 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 8 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 15 divergences across 15 ops:
- startRbac: BEHAVIORAL_DIVERGENCE
- attachRole: BEHAVIORAL_DIVERGENCE
- expandRoles: BEHAVIORAL_DIVERGENCE
- checkPermission: BEHAVIORAL_DIVERGENCE
- closeRbac: BEHAVIORAL_DIVERGENCE
- startAbac: BEHAVIORAL_DIVERGENCE
- attachRule: BEHAVIORAL_DIVERGENCE
- evaluateAbac: BEHAVIORAL_DIVERGENCE
- evaluateCombined: BEHAVIORAL_DIVERGENCE
- closeAbac: BEHAVIORAL_DIVERGENCE
- startPolicyStore: BEHAVIORAL_DIVERGENCE
- publishPolicy: BEHAVIORAL_DIVERGENCE
- activatePolicy: BEHAVIORAL_DIVERGENCE
- rollbackPolicy: BEHAVIORAL_DIVERGENCE
- closePolicyStore: BEHAVIORAL_DIVERGENCE
