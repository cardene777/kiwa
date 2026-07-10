# Quality Report — @kiwa-lab/ai-llm/dogfood-agent-orchestration-app @ 0.1.0

_Reported at 2026-07-10T04:12:55.306Z._

## 11-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 87.00% |
| coverage — function | 94.00% |
| test count — total | 74 |
| test count — behavior | 66 |
| test count — integration | 4 |
| test count — e2e | 4 |
| fidelity — ratio | 100.00% (8/8) |
| fidelity — behavioralDivergences | 8 |
| perf — p50 | 1.00ms |
| perf — p95 | 1.00ms |
| perf — p99 | 1.00ms |
| perf — samples | 5 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| cost — perRequestUsd | $0.0000 (5 requests, total $0.0000) |
| latency — p50 | 1.00ms |
| latency — p95 | 1.00ms |
| latency — p99 | 1.00ms |
| token — total | 10 (prompt 10 + completion 0) |
| accuracy — score | 1.0000 (deterministic-planner-parity, 5 samples) |

## Release gate

- verdict: **PASS**
- axes evaluated: 11

## Notes

Observed 8 divergences across 8 ops:
- startAgent: BEHAVIORAL_DIVERGENCE
- reactStep: BEHAVIORAL_DIVERGENCE
- expandToT: BEHAVIORAL_DIVERGENCE
- reflect: BEHAVIORAL_DIVERGENCE
- selectTool: BEHAVIORAL_DIVERGENCE
- closeAgent: BEHAVIORAL_DIVERGENCE
- startPipeline: BEHAVIORAL_DIVERGENCE
- runPipeline: BEHAVIORAL_DIVERGENCE
