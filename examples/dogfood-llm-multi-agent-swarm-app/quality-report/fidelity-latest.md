# Quality Report — @kiwa-test/ai-llm/dogfood-multi-agent-swarm-app @ 0.1.0

_Reported at 2026-07-07T11:14:48.901Z._

## 11-axis summary

| axis | value |
|---|---|
| coverage — line | 93.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 97 |
| test count — behavior | 90 |
| test count — integration | 3 |
| test count — e2e | 4 |
| fidelity — ratio | 100.00% (13/13) |
| fidelity — behavioralDivergences | 13 |
| perf — p50 | 1.00ms |
| perf — p95 | 1.00ms |
| perf — p99 | 1.00ms |
| perf — samples | 9 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| cost — perRequestUsd | $0.0000 (9 requests, total $0.0000) |
| latency — p50 | 1.00ms |
| latency — p95 | 1.00ms |
| latency — p99 | 1.00ms |
| token — total | 10 (prompt 10 + completion 0) |
| accuracy — score | 1.0000 (deterministic-delegation-parity, 9 samples) |

## Release gate

- verdict: **PASS**
- axes evaluated: 11

## Notes

Observed 13 divergences across 13 ops:
- startMao: BEHAVIORAL_DIVERGENCE
- assembleCrew: BEHAVIORAL_DIVERGENCE
- delegateBySupervisor: BEHAVIORAL_DIVERGENCE
- transitionGraph: BEHAVIORAL_DIVERGENCE
- completeRound: BEHAVIORAL_DIVERGENCE
- closeMao: BEHAVIORAL_DIVERGENCE
- startSwarm: BEHAVIORAL_DIVERGENCE
- assignRoles: BEHAVIORAL_DIVERGENCE
- allocateTasks: BEHAVIORAL_DIVERGENCE
- reachConsensus: BEHAVIORAL_DIVERGENCE
- tolerateByzantine: BEHAVIORAL_DIVERGENCE
- closeSwarm: BEHAVIORAL_DIVERGENCE
- runPipeline: BEHAVIORAL_DIVERGENCE
