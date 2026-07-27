# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.14ms | 100ms | PASS | stable |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.06ms | 100ms | PASS | stable |
| endpoint_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.60ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.16ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.17ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 75928 B | 0 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 1832 B | 0 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | -2408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.11ms |
| p95 | 0.14ms |
| p99 | 0.16ms |
| mean | 0.12ms |
| stdev | 0.02ms |
| min | 0.10ms |
| max | 0.16ms |
| total | 2.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.11ms | 0.11ms | -0.00ms | -1.29% |
| p95 | 0.14ms | 0.14ms | -0.00ms | -2.44% |
| p99 | 0.16ms | 0.15ms | +0.01ms | +5.67% |
| mean | 0.12ms | 0.12ms | -0.00ms | -1.97% |
| min | 0.10ms | 0.10ms | +0.00ms | +0.91% |
| max | 0.16ms | 0.15ms | +0.01ms | +7.62% |
| total | 2.33ms | 2.38ms | -0.05ms | -1.97% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.03ms | +0.01ms | +27.08% |
| p95 | 0.06ms | 0.05ms | +0.00ms | +8.08% |
| p99 | 0.06ms | 0.06ms | -0.00ms | -0.56% |
| mean | 0.04ms | 0.03ms | +0.01ms | +23.72% |
| min | 0.04ms | 0.03ms | +0.01ms | +22.28% |
| max | 0.06ms | 0.06ms | -0.00ms | -2.50% |
| total | 0.86ms | 0.70ms | +0.17ms | +23.72% |

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
| max | 0.05ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +10.15% |
| p95 | 0.03ms | 0.04ms | -0.00ms | -5.48% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +10.14% |
| mean | 0.03ms | 0.03ms | +0.00ms | +7.08% |
| min | 0.03ms | 0.03ms | +0.00ms | +3.49% |
| max | 0.05ms | 0.04ms | +0.01ms | +13.66% |
| total | 0.66ms | 0.61ms | +0.04ms | +7.08% |

