# Quality Report — @kiwa-test/realtime/nextjs-webrtc-video-app @ 0.2.0

_Reported at 2026-07-05T13:40:40.798Z._

## 5-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 31 |
| test count — behavior | 22 |
| test count — integration | 6 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (8/8) |
| fidelity — behavioralDivergences | 8 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 4 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |

## Release gate

- verdict: **PASS**
- axes evaluated: 7

## Notes

Observed 8 divergences across 8 ops:
- joinRoom: BEHAVIORAL_DIVERGENCE
- publishTrack: BEHAVIORAL_DIVERGENCE
- selectLayer: BEHAVIORAL_DIVERGENCE
- muteTrack: BEHAVIORAL_DIVERGENCE
- unmuteTrack: BEHAVIORAL_DIVERGENCE
- iceRestart: BEHAVIORAL_DIVERGENCE
- unpublishTrack: BEHAVIORAL_DIVERGENCE
- leaveRoom: BEHAVIORAL_DIVERGENCE
