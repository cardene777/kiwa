# Quality Report — @kiwa/payment/dogfood-crypto-fx-app @ 0.5.0

_Reported at 2026-07-07T13:28:47.599Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 87.00% |
| coverage — function | 94.00% |
| test count — total | 53 |
| test count — behavior | 45 |
| test count — integration | 5 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (14/14) |
| fidelity — behavioralDivergences | 14 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 10 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 14 divergences across 14 ops:
- startInvoice: BEHAVIORAL_DIVERGENCE
- createInvoice: BEHAVIORAL_DIVERGENCE
- confirmTx: BEHAVIORAL_DIVERGENCE
- abstractGas: BEHAVIORAL_DIVERGENCE
- linkWallet: BEHAVIORAL_DIVERGENCE
- checkInvoiceStatus: BEHAVIORAL_DIVERGENCE
- closeInvoice: BEHAVIORAL_DIVERGENCE
- startFx: BEHAVIORAL_DIVERGENCE
- lockRate: BEHAVIORAL_DIVERGENCE
- initiateSettlement: BEHAVIORAL_DIVERGENCE
- completeSettlement: BEHAVIORAL_DIVERGENCE
- checkFxStatus: BEHAVIORAL_DIVERGENCE
- expireRate: BEHAVIORAL_DIVERGENCE
- closeFx: BEHAVIORAL_DIVERGENCE
