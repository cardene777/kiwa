# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.30ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +207%) 以上の悪化が必要) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.23ms | 100ms | PASS | stable (差 0.17ms が下限 0.5ms 未満で判定を保留) |
| endpoint_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable (差 0.06ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.73ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.23ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.25ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 102200 B | -1684 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 648 B | 0 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | -1624 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.13ms |
| p95 | 0.30ms |
| p99 | 0.31ms |
| mean | 0.16ms |
| stdev | 0.07ms |
| min | 0.10ms |
| max | 0.31ms |
| total | 3.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.13ms | 0.06ms | +0.07ms | +112.56% |
| p95 | 0.30ms | 0.24ms | +0.06ms | +24.35% |
| p99 | 0.31ms | 0.55ms | -0.25ms | -44.50% |
| mean | 0.16ms | 0.09ms | +0.07ms | +75.32% |
| min | 0.10ms | 0.04ms | +0.05ms | +123.63% |
| max | 0.31ms | 0.98ms | -0.68ms | -68.68% |
| total | 3.28ms | 18.69ms | -15.41ms | -82.47% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.23ms |
| p99 | 0.43ms |
| mean | 0.11ms |
| stdev | 0.11ms |
| min | 0.04ms |
| max | 0.48ms |
| total | 2.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.01ms | +21.64% |
| p95 | 0.23ms | 0.05ms | +0.17ms | +318.34% |
| p99 | 0.43ms | 0.27ms | +0.17ms | +62.44% |
| mean | 0.11ms | 0.05ms | +0.06ms | +115.17% |
| min | 0.04ms | 0.04ms | +0.00ms | +9.50% |
| max | 0.48ms | 0.81ms | -0.33ms | -40.64% |
| total | 2.21ms | 10.25ms | -8.05ms | -78.48% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

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
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -13.08% |
| p95 | 0.04ms | 0.09ms | -0.06ms | -61.21% |
| p99 | 0.04ms | 0.23ms | -0.19ms | -82.86% |
| mean | 0.03ms | 0.05ms | -0.01ms | -32.04% |
| min | 0.03ms | 0.03ms | -0.00ms | -7.94% |
| max | 0.04ms | 0.52ms | -0.48ms | -92.07% |
| total | 0.62ms | 9.17ms | -8.55ms | -93.20% |

