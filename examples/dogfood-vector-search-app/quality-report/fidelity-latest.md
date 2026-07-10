# Quality Report — @kiwa-lab/orm/vector-search-dogfood @ 0.1.0

_Reported at 2026-07-10T04:16:44.770Z._

## 5-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 35 |
| test count — behavior | 25 |
| test count — integration | 6 |
| test count — e2e | 4 |
| fidelity — ratio | 100.00% (5/5) |
| fidelity — behavioralDivergences | 5 |
| perf — p50 | 0.06ms |
| perf — p95 | 3.22ms |
| perf — p99 | 3.22ms |
| perf — samples | 2 |
| mutation — killRate | 73.33% (22/30) |
| mutation — survived | 8 |

## Release gate

- verdict: **PASS**
- axes evaluated: 7

## Notes

Observed 5 divergences across 5 ops:
- driveIndexBuild: BEHAVIORAL_DIVERGENCE
- driveSemanticSearch: BEHAVIORAL_DIVERGENCE
- driveHybridSearch: BEHAVIORAL_DIVERGENCE
- driveCacheHitRate: BEHAVIORAL_DIVERGENCE
- emitFidelity: BEHAVIORAL_DIVERGENCE
