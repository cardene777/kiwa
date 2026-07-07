# Quality Report — @kiwa-test/payment/dogfood-embedded-finance-app @ 0.5.0

_Reported at 2026-07-07T12:54:45.047Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 87.00% |
| coverage — function | 94.00% |
| test count — total | 58 |
| test count — behavior | 50 |
| test count — integration | 5 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (15/15) |
| fidelity — behavioralDivergences | 15 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 9 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 15 divergences across 15 ops:
- startTreasury: BEHAVIORAL_DIVERGENCE
- openAccount: BEHAVIORAL_DIVERGENCE
- fundAccount: BEHAVIORAL_DIVERGENCE
- transferFunds: BEHAVIORAL_DIVERGENCE
- closeTreasury: BEHAVIORAL_DIVERGENCE
- startCard: BEHAVIORAL_DIVERGENCE
- issueCard: BEHAVIORAL_DIVERGENCE
- activateCard: BEHAVIORAL_DIVERGENCE
- spendCard: BEHAVIORAL_DIVERGENCE
- closeCard: BEHAVIORAL_DIVERGENCE
- startKyc: BEHAVIORAL_DIVERGENCE
- verifyIndividual: BEHAVIORAL_DIVERGENCE
- verifyBusiness: BEHAVIORAL_DIVERGENCE
- checkScoreThreshold: BEHAVIORAL_DIVERGENCE
- closeKyc: BEHAVIORAL_DIVERGENCE
