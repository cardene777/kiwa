# Quality Report — @kiwa/observability/dogfood-llm-ops-app @ 2.2.0

_Reported at 2026-07-07T15:04:37.764Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 87.00% |
| coverage — function | 94.00% |
| test count — total | 45 |
| test count — behavior | 40 |
| test count — integration | 4 |
| test count — e2e | 1 |
| fidelity — ratio | 100.00% (10/10) |
| fidelity — behavioralDivergences | 10 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 4 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 10 divergences across 10 ops:
- startToken: BEHAVIORAL_DIVERGENCE
- countTokens: BEHAVIORAL_DIVERGENCE
- closeToken: BEHAVIORAL_DIVERGENCE
- startPrompt: BEHAVIORAL_DIVERGENCE
- logPrompt: BEHAVIORAL_DIVERGENCE
- flagHallucination: BEHAVIORAL_DIVERGENCE
- closePrompt: BEHAVIORAL_DIVERGENCE
- startBudget: BEHAVIORAL_DIVERGENCE
- checkBudget: BEHAVIORAL_DIVERGENCE
- closeBudget: BEHAVIORAL_DIVERGENCE
