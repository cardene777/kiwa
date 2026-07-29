# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.09ms | 0.15ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.04ms | 0.05ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| endpoint_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.41ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.16ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 82456 B | -30 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 712 B | 0 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | -1560 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.15ms |
| p99 | 0.16ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.16ms |
| total | 2.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.11ms | -0.01ms | -10.73% |
| p50 | 0.11ms | 0.12ms | -0.0077ms | -6.53% |
| p95 | 0.15ms | 0.17ms | -0.02ms | -12.26% |
| p99 | 0.16ms | 0.18ms | -0.02ms | -11.58% |
| mean | 0.11ms | 0.13ms | -0.01ms | -9.75% |
| min | 0.09ms | 0.10ms | -0.0059ms | -6.13% |
| max | 0.16ms | 0.18ms | -0.02ms | -11.42% |
| total | 2.28ms | 2.52ms | -0.25ms | -9.75% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0035ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0014ms | -3.48% |
| p50 | 0.04ms | 0.04ms | -0.00038ms | -0.93% |
| p95 | 0.05ms | 0.05ms | -0.0012ms | -2.34% |
| p99 | 0.05ms | 0.06ms | -0.0063ms | -11.42% |
| mean | 0.04ms | 0.04ms | -0.00075ms | -1.80% |
| min | 0.04ms | 0.04ms | -0.0010ms | -2.58% |
| max | 0.05ms | 0.06ms | -0.0076ms | -13.41% |
| total | 0.82ms | 0.83ms | -0.02ms | -1.80% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0040ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0012ms | -3.72% |
| p50 | 0.03ms | 0.03ms | -0.00040ms | -1.23% |
| p95 | 0.04ms | 0.05ms | -0.0071ms | -14.85% |
| p99 | 0.04ms | 0.09ms | -0.05ms | -52.29% |
| mean | 0.03ms | 0.04ms | -0.0049ms | -13.02% |
| min | 0.03ms | 0.03ms | -0.0011ms | -3.49% |
| max | 0.05ms | 0.11ms | -0.06ms | -56.55% |
| total | 0.66ms | 0.76ms | -0.10ms | -13.02% |

