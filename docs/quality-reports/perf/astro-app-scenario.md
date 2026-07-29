# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.18ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +207%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.05ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +912%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| endpoint_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable (差 0.05ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.82ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.18ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.17ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 90376 B | 1328 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | -3768 B | -4860 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.14ms |
| p95 | 0.18ms |
| p99 | 0.18ms |
| mean | 0.15ms |
| stdev | 0.02ms |
| min | 0.12ms |
| max | 0.18ms |
| total | 2.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.14ms | 0.06ms | +0.08ms | +127.98% |
| p95 | 0.18ms | 0.24ms | -0.07ms | -27.17% |
| p99 | 0.18ms | 0.55ms | -0.37ms | -67.51% |
| mean | 0.15ms | 0.09ms | +0.05ms | +55.47% |
| min | 0.12ms | 0.04ms | +0.07ms | +167.49% |
| max | 0.18ms | 0.98ms | -0.80ms | -81.67% |
| total | 2.91ms | 18.69ms | -15.78ms | -84.45% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.05ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +9.35% |
| p95 | 0.05ms | 0.05ms | -0.00ms | -0.52% |
| p99 | 0.05ms | 0.27ms | -0.21ms | -79.31% |
| mean | 0.05ms | 0.05ms | -0.01ms | -10.33% |
| min | 0.04ms | 0.04ms | +0.01ms | +20.51% |
| max | 0.05ms | 0.81ms | -0.76ms | -93.22% |
| total | 0.92ms | 10.25ms | -9.33ms | -91.03% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -0.30% |
| p95 | 0.04ms | 0.09ms | -0.05ms | -52.88% |
| p99 | 0.05ms | 0.23ms | -0.19ms | -79.73% |
| mean | 0.04ms | 0.05ms | -0.01ms | -21.54% |
| min | 0.03ms | 0.03ms | +0.00ms | +4.95% |
| max | 0.05ms | 0.52ms | -0.47ms | -90.68% |
| total | 0.72ms | 9.17ms | -8.45ms | -92.15% |

