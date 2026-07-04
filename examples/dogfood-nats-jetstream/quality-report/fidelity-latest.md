# Quality Report — @kiwa-test/streaming/nats-jetstream-dogfood @ 0.1.0

_Reported at 2026-07-04T04:09:02.482Z._

## 5-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 43 |
| test count — behavior | 29 |
| test count — integration | 7 |
| test count — e2e | 7 |
| fidelity — ratio | 100.00% (5/5) |
| fidelity — behavioralDivergences | 5 |
| perf — p50 | 0.05ms |
| perf — p95 | 1.49ms |
| perf — p99 | 1.49ms |
| perf — samples | 2 |
| mutation — killRate | 72.00% (18/25) |
| mutation — survived | 7 |

## Release gate

- verdict: **PASS**
- axes evaluated: 7

## Notes

Observed 5 divergences across 5 ops:
- driveJetStream: BEHAVIORAL_DIVERGENCE
- driveKV: BEHAVIORAL_DIVERGENCE
- driveObject: BEHAVIORAL_DIVERGENCE
- driveRouting: BEHAVIORAL_DIVERGENCE
- emitFidelity: BEHAVIORAL_DIVERGENCE
