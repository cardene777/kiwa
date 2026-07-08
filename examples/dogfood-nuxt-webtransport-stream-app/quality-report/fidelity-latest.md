# Quality Report — @kiwa/realtime/nuxt-webtransport-stream-app @ 0.2.0

_Reported at 2026-07-06T02:44:24.241Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 31 |
| test count — behavior | 22 |
| test count — integration | 6 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (9/9) |
| fidelity — behavioralDivergences | 9 |
| perf — p50 | 1.00ms |
| perf — p95 | 2.00ms |
| perf — p99 | 2.00ms |
| perf — samples | 6 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 9 divergences across 9 ops:
- openSession: BEHAVIORAL_DIVERGENCE
- openUniStream: BEHAVIORAL_DIVERGENCE
- writeStream: BEHAVIORAL_DIVERGENCE
- openBiStream: BEHAVIORAL_DIVERGENCE
- readStream: BEHAVIORAL_DIVERGENCE
- sendDatagram: BEHAVIORAL_DIVERGENCE
- resetStream: BEHAVIORAL_DIVERGENCE
- migrateConnection: BEHAVIORAL_DIVERGENCE
- closeSession: BEHAVIORAL_DIVERGENCE
