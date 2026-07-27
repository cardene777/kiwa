# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.14ms | 100ms | PASS | stable |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.04ms | 100ms | PASS | stable |
| endpoint_error_handling (5 throw + catch) | 0.05ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.48ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.10ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.23ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 3866344 B | 3000 B | 102400 B | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 1415608 B | 1800 B | 102400 B | PASS |
| endpoint_error_handling (5 throw + catch) | 710000 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.11ms |
| p95 | 0.14ms |
| p99 | 0.15ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.15ms |
| total | 2.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.11ms | 0.11ms | +0.00ms | +0.74% |
| p95 | 0.14ms | 0.20ms | -0.05ms | -27.74% |
| p99 | 0.15ms | 0.25ms | -0.09ms | -37.97% |
| mean | 0.11ms | 0.12ms | -0.01ms | -7.76% |
| min | 0.09ms | 0.09ms | -0.00ms | -1.44% |
| max | 0.15ms | 0.26ms | -0.10ms | -39.93% |
| total | 2.30ms | 2.49ms | -0.19ms | -7.76% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -6.54% |
| p95 | 0.04ms | 0.03ms | +0.00ms | +5.67% |
| p99 | 0.04ms | 0.04ms | -0.00ms | -1.45% |
| mean | 0.03ms | 0.03ms | -0.00ms | -6.75% |
| min | 0.02ms | 0.03ms | -0.00ms | -16.64% |
| max | 0.04ms | 0.04ms | -0.00ms | -3.01% |
| total | 0.57ms | 0.61ms | -0.04ms | -6.75% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +8.44% |
| p95 | 0.05ms | 0.04ms | +0.01ms | +25.13% |
| p99 | 0.05ms | 0.17ms | -0.12ms | -71.03% |
| mean | 0.03ms | 0.03ms | -0.01ms | -16.63% |
| min | 0.02ms | 0.02ms | +0.00ms | +2.88% |
| max | 0.05ms | 0.21ms | -0.16ms | -75.50% |
| total | 0.54ms | 0.64ms | -0.11ms | -16.63% |

