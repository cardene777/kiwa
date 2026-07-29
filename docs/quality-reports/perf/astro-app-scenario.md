# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.11ms | 0.19ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| endpoint_error_handling (5 throw + catch) | 0.04ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.94ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.11ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.16ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 63288 B | 0 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | -95696 B | 0 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.11ms |
| p50 | 0.13ms |
| p95 | 0.19ms |
| p99 | 0.20ms |
| mean | 0.14ms |
| stdev | 0.03ms |
| min | 0.11ms |
| max | 0.20ms |
| total | 2.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.11ms | +0.0023ms | +2.22% |
| p50 | 0.13ms | 0.12ms | +0.0097ms | +8.24% |
| p95 | 0.19ms | 0.17ms | +0.02ms | +12.41% |
| p99 | 0.20ms | 0.18ms | +0.02ms | +13.48% |
| mean | 0.14ms | 0.13ms | +0.01ms | +8.03% |
| min | 0.11ms | 0.10ms | +0.0092ms | +9.61% |
| max | 0.20ms | 0.18ms | +0.02ms | +13.74% |
| total | 2.73ms | 2.52ms | +0.20ms | +8.03% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0044ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.01ms | -35.54% |
| p50 | 0.03ms | 0.04ms | -0.01ms | -35.61% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -39.13% |
| p99 | 0.04ms | 0.06ms | -0.01ms | -24.00% |
| mean | 0.03ms | 0.04ms | -0.01ms | -34.33% |
| min | 0.03ms | 0.04ms | -0.01ms | -34.98% |
| max | 0.05ms | 0.06ms | -0.01ms | -20.67% |
| total | 0.55ms | 0.83ms | -0.29ms | -34.33% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0031ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0042ms | +13.52% |
| p50 | 0.04ms | 0.03ms | +0.0053ms | +16.54% |
| p95 | 0.04ms | 0.05ms | -0.0039ms | -8.06% |
| p99 | 0.05ms | 0.09ms | -0.05ms | -50.56% |
| mean | 0.04ms | 0.04ms | +0.00037ms | +0.99% |
| min | 0.04ms | 0.03ms | +0.0041ms | +13.29% |
| max | 0.05ms | 0.11ms | -0.06ms | -55.40% |
| total | 0.76ms | 0.76ms | +0.0075ms | +0.99% |

