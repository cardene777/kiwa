# Quality Report — @kiwa-lab/ai-llm/dogfood-ops-registry-app @ 0.1.0

_Reported at 2026-07-07T11:46:02.897Z._

## 11-axis summary

| axis | value |
|---|---|
| coverage — line | 93.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 76 |
| test count — behavior | 70 |
| test count — integration | 3 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (8/8) |
| fidelity — behavioralDivergences | 8 |
| perf — p50 | 1.00ms |
| perf — p95 | 1.00ms |
| perf — p99 | 1.00ms |
| perf — samples | 7 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| cost — perRequestUsd | $0.0000 (7 requests, total $0.0000) |
| latency — p50 | 1.00ms |
| latency — p95 | 1.00ms |
| latency — p99 | 1.00ms |
| token — total | 10 (prompt 10 + completion 0) |
| accuracy — score | 1.0000 (deterministic-ops-parity, 7 samples) |

## Release gate

- verdict: **PASS**
- axes evaluated: 11

## Notes

Observed 8 divergences across 8 ops:
- startOps: BEHAVIORAL_DIVERGENCE
- updateRegistry: BEHAVIORAL_DIVERGENCE
- advanceRollout: BEHAVIORAL_DIVERGENCE
- evaluateAb: BEHAVIORAL_DIVERGENCE
- promoteCanary: BEHAVIORAL_DIVERGENCE
- compareShadow: BEHAVIORAL_DIVERGENCE
- closeOps: BEHAVIORAL_DIVERGENCE
- runPipeline: BEHAVIORAL_DIVERGENCE
