# Quality Report — @kiwa-lab/orm/sqlite-wal-fts-dogfood @ 0.1.0

_Reported at 2026-07-06T08:14:26.235Z._

## 5-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 25 |
| test count — behavior | 18 |
| test count — integration | 4 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (5/5) |
| fidelity — behavioralDivergences | 5 |
| perf — p50 | 0.06ms |
| perf — p95 | 0.64ms |
| perf — p99 | 0.64ms |
| perf — samples | 2 |
| mutation — killRate | 75.00% (15/20) |
| mutation — survived | 5 |

## Release gate

- verdict: **PASS**
- axes evaluated: 7

## Notes

Observed 5 divergences across 5 ops:
- driveWalFullJourney: BEHAVIORAL_DIVERGENCE
- driveFts5FullJourney: BEHAVIORAL_DIVERGENCE
- driveEdgeRoundtrip: BEHAVIORAL_DIVERGENCE
- driveTestcontainersProbe: BEHAVIORAL_DIVERGENCE
- emitFidelity: BEHAVIORAL_DIVERGENCE
