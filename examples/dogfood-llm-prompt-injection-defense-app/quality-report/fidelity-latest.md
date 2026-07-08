# Quality Report — @kiwa/ai-llm/dogfood-prompt-injection-defense-app @ 0.1.0

_Reported at 2026-07-07T05:13:06.954Z._

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
| fidelity — ratio | 100.00% (14/14) |
| fidelity — behavioralDivergences | 14 |
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
| accuracy — score | 1.0000 (deterministic-classifier-parity, 9 samples) |

## Release gate

- verdict: **PASS**
- axes evaluated: 11

## Notes

Observed 14 divergences across 14 ops:
- startInjection: BEHAVIORAL_DIVERGENCE
- analyzeInjection: BEHAVIORAL_DIVERGENCE
- classifyDirect: BEHAVIORAL_DIVERGENCE
- blockJailbreak: BEHAVIORAL_DIVERGENCE
- blockRoleHijack: BEHAVIORAL_DIVERGENCE
- closeInjection: BEHAVIORAL_DIVERGENCE
- startGuardrail: BEHAVIORAL_DIVERGENCE
- validateSchema: BEHAVIORAL_DIVERGENCE
- blockToxicity: BEHAVIORAL_DIVERGENCE
- redactPii: BEHAVIORAL_DIVERGENCE
- checkConstitutional: BEHAVIORAL_DIVERGENCE
- closeGuardrail: BEHAVIORAL_DIVERGENCE
- startPipeline: BEHAVIORAL_DIVERGENCE
- runPipeline: BEHAVIORAL_DIVERGENCE
