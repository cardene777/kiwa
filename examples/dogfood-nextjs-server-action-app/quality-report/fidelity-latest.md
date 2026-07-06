# Quality Report — @kiwa-test/component/nextjs-server-action-app @ 0.3.0

_Reported at 2026-07-06T13:13:21.490Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 93.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 49 |
| test count — behavior | 40 |
| test count — integration | 6 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (15/15) |
| fidelity — behavioralDivergences | 15 |
| perf — p50 | 0.00ms |
| perf — p95 | 0.00ms |
| perf — p99 | 0.00ms |
| perf — samples | 3 |
| mutation — killRate | 70.00% (28/40) |
| mutation — survived | 12 |
| a11y — critical / serious / moderate | 0 / 0 / 0 (minor 0) |

## Release gate

- verdict: **PASS**
- axes evaluated: 8

## Notes

Observed 15 divergences across 15 ops:
- startSubscribe: BEHAVIORAL_DIVERGENCE
- submitSubscribe: BEHAVIORAL_DIVERGENCE
- revalidateSubscribePath: BEHAVIORAL_DIVERGENCE
- startLike: BEHAVIORAL_DIVERGENCE
- markLikePending: BEHAVIORAL_DIVERGENCE
- applyOptimisticLike: BEHAVIORAL_DIVERGENCE
- submitLike: BEHAVIORAL_DIVERGENCE
- revalidateLikeTag: BEHAVIORAL_DIVERGENCE
- resolveLike: BEHAVIORAL_DIVERGENCE
- startLogin: BEHAVIORAL_DIVERGENCE
- enhanceLogin: BEHAVIORAL_DIVERGENCE
- markLoginPending: BEHAVIORAL_DIVERGENCE
- submitLogin: BEHAVIORAL_DIVERGENCE
- redirectLogin: BEHAVIORAL_DIVERGENCE
- resolveLogin: BEHAVIORAL_DIVERGENCE
