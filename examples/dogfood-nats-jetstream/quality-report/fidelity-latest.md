# Quality Report — @kiwa-test/streaming/nats-jetstream-dogfood @ 0.2.0

_Reported at 2026-07-06T05:33:38.699Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 56 |
| test count — behavior | 45 |
| test count — integration | 8 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (9/9) |
| fidelity — behavioralDivergences | 9 |
| perf — p50 | 0.05ms |
| perf — p95 | 2.54ms |
| perf — p99 | 2.54ms |
| perf — samples | 2 |
| mutation — killRate | 72.00% (18/25) |
| mutation — survived | 7 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 9

## Notes

Observed 9 divergences across 9 ops:
- driveJetStream: BEHAVIORAL_DIVERGENCE
- driveKV: BEHAVIORAL_DIVERGENCE
- driveObject: BEHAVIORAL_DIVERGENCE
- driveRouting: BEHAVIORAL_DIVERGENCE
- emitFidelity: BEHAVIORAL_DIVERGENCE
- driveJetStreamDurable: BEHAVIORAL_DIVERGENCE
- driveKvRevision: BEHAVIORAL_DIVERGENCE
- driveObjectChunking: BEHAVIORAL_DIVERGENCE
- driveTestcontainersProbe: BEHAVIORAL_DIVERGENCE
