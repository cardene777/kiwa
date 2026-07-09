# Quality Report — @kiwa-lab/realtime/sveltekit-http3-multiplex-app @ 0.2.0

_Reported at 2026-07-06T02:44:27.838Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 33 |
| test count — behavior | 24 |
| test count — integration | 6 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (9/9) |
| fidelity — behavioralDivergences | 9 |
| perf — p50 | 0.00ms |
| perf — p95 | 3.00ms |
| perf — p99 | 3.00ms |
| perf — samples | 4 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 9 divergences across 9 ops:
- openConnection: BEHAVIORAL_DIVERGENCE
- openStream: BEHAVIORAL_DIVERGENCE
- writeStream: BEHAVIORAL_DIVERGENCE
- readStream: BEHAVIORAL_DIVERGENCE
- concurrentSend: BEHAVIORAL_DIVERGENCE
- insertHpackHeader: BEHAVIORAL_DIVERGENCE
- resumeZeroRtt: BEHAVIORAL_DIVERGENCE
- closeStream: BEHAVIORAL_DIVERGENCE
- closeConnection: BEHAVIORAL_DIVERGENCE
