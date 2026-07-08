# Quality Report — @kiwa/payment/dogfood-bnpl-installment-app @ 0.5.0

_Reported at 2026-07-07T13:11:07.017Z._

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
| fidelity — ratio | 100.00% (14/14) |
| fidelity — behavioralDivergences | 14 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 8 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 14 divergences across 14 ops:
- startPlan: BEHAVIORAL_DIVERGENCE
- createPlan: BEHAVIORAL_DIVERGENCE
- scheduleInstallment: BEHAVIORAL_DIVERGENCE
- startRisk: BEHAVIORAL_DIVERGENCE
- scoreCustomerRisk: BEHAVIORAL_DIVERGENCE
- checkRiskThreshold: BEHAVIORAL_DIVERGENCE
- closeRisk: BEHAVIORAL_DIVERGENCE
- startCollection: BEHAVIORAL_DIVERGENCE
- chargeLateFee: BEHAVIORAL_DIVERGENCE
- markPaid: BEHAVIORAL_DIVERGENCE
- checkCollectionStatus: BEHAVIORAL_DIVERGENCE
- settlePlan: BEHAVIORAL_DIVERGENCE
- closeCollection: BEHAVIORAL_DIVERGENCE
- closePlan: BEHAVIORAL_DIVERGENCE
