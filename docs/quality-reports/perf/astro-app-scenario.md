# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.14ms | 100ms | PASS | stable |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.05ms | 100ms | PASS | stable |
| endpoint_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.61ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.13ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | -68512 B | 15 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | -53768 B | 0 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | -1360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.12ms |
| p95 | 0.14ms |
| p99 | 0.14ms |
| mean | 0.12ms |
| stdev | 0.01ms |
| min | 0.11ms |
| max | 0.14ms |
| total | 2.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.12ms | 0.11ms | +0.00ms | +1.13% |
| p95 | 0.14ms | 0.14ms | -0.00ms | -0.48% |
| p99 | 0.14ms | 0.15ms | -0.00ms | -3.17% |
| mean | 0.12ms | 0.12ms | +0.00ms | +1.84% |
| min | 0.11ms | 0.10ms | +0.01ms | +10.01% |
| max | 0.14ms | 0.15ms | -0.01ms | -3.82% |
| total | 2.42ms | 2.38ms | +0.04ms | +1.84% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -1.80% |
| p95 | 0.05ms | 0.05ms | -0.00ms | -8.42% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -12.41% |
| mean | 0.03ms | 0.03ms | -0.00ms | -3.13% |
| min | 0.03ms | 0.03ms | -0.00ms | -1.99% |
| max | 0.05ms | 0.06ms | -0.01ms | -13.31% |
| total | 0.68ms | 0.70ms | -0.02ms | -3.13% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +1.76% |
| p95 | 0.03ms | 0.04ms | -0.00ms | -9.25% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +1.46% |
| mean | 0.03ms | 0.03ms | +0.00ms | +0.48% |
| min | 0.03ms | 0.03ms | +0.00ms | +1.45% |
| max | 0.04ms | 0.04ms | +0.00ms | +3.88% |
| total | 0.62ms | 0.61ms | +0.00ms | +0.48% |

