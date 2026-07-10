# Quality Report — @kiwa-lab/edge/deno-deploy-geo @ 0.1.0

_Reported at 2026-07-10T04:11:39.260Z._

## 5-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 86.00% |
| coverage — function | 95.00% |
| test count — total | 42 |
| test count — behavior | 30 |
| test count — integration | 6 |
| test count — e2e | 6 |
| fidelity — ratio | 100.00% (8/8) |
| fidelity — behavioralDivergences | 8 |
| perf — p50 | 0.06ms |
| perf — p95 | 0.15ms |
| perf — p99 | 0.15ms |
| perf — samples | 8 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |

## Release gate

- verdict: **PASS**
- axes evaluated: 7

## Notes

Observed 8 divergences across 8 ops:
- driveGeoRoute: BEHAVIORAL_DIVERGENCE
- driveGeoPrimaryWrite: BEHAVIORAL_DIVERGENCE
- driveGeoReplicaSync: BEHAVIORAL_DIVERGENCE
- driveKvWrite: BEHAVIORAL_DIVERGENCE
- driveKvRangeQuery: BEHAVIORAL_DIVERGENCE
- driveReadYourWrites: BEHAVIORAL_DIVERGENCE
- driveCronSchedule: BEHAVIORAL_DIVERGENCE
- driveCronComplete: BEHAVIORAL_DIVERGENCE
