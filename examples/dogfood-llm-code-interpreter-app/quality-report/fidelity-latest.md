# Quality Report — @kiwa-lab/ai-llm/dogfood-code-interpreter-app @ 0.1.0

_Reported at 2026-07-10T04:12:59.167Z._

## 11-axis summary

| axis | value |
|---|---|
| coverage — line | 93.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 72 |
| test count — behavior | 65 |
| test count — integration | 3 |
| test count — e2e | 4 |
| fidelity — ratio | 100.00% (7/7) |
| fidelity — behavioralDivergences | 7 |
| perf — p50 | 1.00ms |
| perf — p95 | 1.00ms |
| perf — p99 | 1.00ms |
| perf — samples | 6 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| cost — perRequestUsd | $0.0000 (6 requests, total $0.0000) |
| latency — p50 | 1.00ms |
| latency — p95 | 1.00ms |
| latency — p99 | 1.00ms |
| token — total | 10 (prompt 10 + completion 0) |
| accuracy — score | 1.0000 (deterministic-sandbox-parity, 6 samples) |

## Release gate

- verdict: **PASS**
- axes evaluated: 11

## Notes

Observed 7 divergences across 7 ops:
- startCi: BEHAVIORAL_DIVERGENCE
- startSandbox: BEHAVIORAL_DIVERGENCE
- executeCode: BEHAVIORAL_DIVERGENCE
- useTool: BEHAVIORAL_DIVERGENCE
- rollback: BEHAVIORAL_DIVERGENCE
- closeCi: BEHAVIORAL_DIVERGENCE
- runPipeline: BEHAVIORAL_DIVERGENCE
