# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.14ms | 100ms | PASS | stable |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.04ms | 100ms | PASS | stable |
| endpoint_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.59ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.15ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 62256 B | 15 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | -53040 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.15ms |
| mean | 0.12ms |
| stdev | 0.01ms |
| min | 0.10ms |
| max | 0.15ms |
| total | 2.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.12ms | 0.11ms | +0.00ms | +3.17% |
| p95 | 0.14ms | 0.14ms | +0.00ms | +0.08% |
| p99 | 0.15ms | 0.15ms | -0.00ms | -1.25% |
| mean | 0.12ms | 0.12ms | +0.00ms | +1.15% |
| min | 0.10ms | 0.10ms | +0.00ms | +0.43% |
| max | 0.15ms | 0.15ms | -0.00ms | -1.57% |
| total | 2.41ms | 2.38ms | +0.03ms | +1.15% |

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
| min | 0.03ms |
| max | 0.04ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -1.61% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -25.03% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -27.23% |
| mean | 0.03ms | 0.03ms | -0.00ms | -6.90% |
| min | 0.03ms | 0.03ms | -0.00ms | -1.59% |
| max | 0.04ms | 0.06ms | -0.02ms | -27.72% |
| total | 0.65ms | 0.70ms | -0.05ms | -6.90% |

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
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +0.42% |
| p95 | 0.03ms | 0.04ms | -0.00ms | -9.62% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +0.64% |
| mean | 0.03ms | 0.03ms | -0.00ms | -0.34% |
| min | 0.03ms | 0.03ms | +0.00ms | +1.31% |
| max | 0.04ms | 0.04ms | +0.00ms | +2.96% |
| total | 0.61ms | 0.61ms | -0.00ms | -0.34% |

