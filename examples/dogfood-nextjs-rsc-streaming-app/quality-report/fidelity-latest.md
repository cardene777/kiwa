# Quality Report — @kiwa-lab/component/nextjs-rsc-streaming-app @ 0.3.0

_Reported at 2026-07-06T12:58:20.396Z._

## 6-axis summary

| axis | value |
|---|---|
| coverage — line | 92.00% |
| coverage — branch | 88.00% |
| coverage — function | 95.00% |
| test count — total | 54 |
| test count — behavior | 45 |
| test count — integration | 6 |
| test count — e2e | 3 |
| fidelity — ratio | 100.00% (15/15) |
| fidelity — behavioralDivergences | 15 |
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

Observed 15 divergences across 15 ops:
- renderArticle: BEHAVIORAL_DIVERGENCE
- enterSuspense: BEHAVIORAL_DIVERGENCE
- streamChunk: BEHAVIORAL_DIVERGENCE
- completeArticle: BEHAVIORAL_DIVERGENCE
- startCatalog: BEHAVIORAL_DIVERGENCE
- pendCatalogBoundary: BEHAVIORAL_DIVERGENCE
- captureCatalogError: BEHAVIORAL_DIVERGENCE
- hydrateCatalogBoundary: BEHAVIORAL_DIVERGENCE
- startTransition: BEHAVIORAL_DIVERGENCE
- finishTransition: BEHAVIORAL_DIVERGENCE
- assertAnimation: BEHAVIORAL_DIVERGENCE
- markFormPending: BEHAVIORAL_DIVERGENCE
- applyOptimistic: BEHAVIORAL_DIVERGENCE
- enhanceForm: BEHAVIORAL_DIVERGENCE
- resolveForm: BEHAVIORAL_DIVERGENCE
