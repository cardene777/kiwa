# Quality Report — @kiwa-test/orm/postgres-cdc-dogfood @ 0.1.0

_Reported at 2026-07-05T06:50:19.546Z._

## 5-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 35 |
| test count — behavior | 24 |
| test count — integration | 6 |
| test count — e2e | 5 |
| fidelity — ratio | 100.00% (5/5) |
| fidelity — behavioralDivergences | 5 |
| perf — p50 | 0.05ms |
| perf — p95 | 0.95ms |
| perf — p99 | 0.95ms |
| perf — samples | 2 |
| mutation — killRate | 73.33% (22/30) |
| mutation — survived | 8 |

## Release gate

- verdict: **PASS**
- axes evaluated: 7

## Notes

Observed 5 divergences across 5 ops:
- driveOutbox: BEHAVIORAL_DIVERGENCE
- driveCdcPickup: BEHAVIORAL_DIVERGENCE
- driveReplication: BEHAVIORAL_DIVERGENCE
- driveAtLeastOnce: BEHAVIORAL_DIVERGENCE
- emitFidelity: BEHAVIORAL_DIVERGENCE
