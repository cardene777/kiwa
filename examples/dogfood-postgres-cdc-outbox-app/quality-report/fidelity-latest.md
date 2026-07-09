# Quality Report — @kiwa-lab/orm/postgres-cdc-dogfood @ 0.1.0

_Reported at 2026-07-06T07:42:03.154Z._

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
| fidelity — ratio | 55.56% (5/9) |
| fidelity — behavioralDivergences | 5 |
| perf — p50 | 0.05ms |
| perf — p95 | 0.92ms |
| perf — p99 | 0.92ms |
| perf — samples | 2 |
| mutation — killRate | 73.33% (22/30) |
| mutation — survived | 8 |

## Release gate

- verdict: **FAIL**
- axes evaluated: 7

### Blockers

| axis | operator | threshold | actual |
|---|---|---|---|
| fidelity.ratio | >= | 70 | 55.56 |

## Notes

Observed 5 divergences across 9 ops:
- driveOutbox: BEHAVIORAL_DIVERGENCE
- driveCdcPickup: BEHAVIORAL_DIVERGENCE
- driveReplication: BEHAVIORAL_DIVERGENCE
- driveAtLeastOnce: BEHAVIORAL_DIVERGENCE
- emitFidelity: BEHAVIORAL_DIVERGENCE
