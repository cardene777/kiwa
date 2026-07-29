# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.10ms | 0.15ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.03ms | 0.10ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| endpoint_error_handling (5 throw + catch) | 0.04ms | 0.05ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.50ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.44ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 93296 B | 3000 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | -97088 B | 0 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.13ms |
| p95 | 0.15ms |
| p99 | 0.16ms |
| mean | 0.13ms |
| stdev | 0.02ms |
| min | 0.10ms |
| max | 0.16ms |
| total | 2.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.11ms | -0.0011ms | -1.01% |
| p50 | 0.13ms | 0.12ms | +0.0082ms | +6.99% |
| p95 | 0.15ms | 0.17ms | -0.02ms | -9.40% |
| p99 | 0.16ms | 0.18ms | -0.02ms | -9.29% |
| mean | 0.13ms | 0.13ms | +0.00067ms | +0.53% |
| min | 0.10ms | 0.10ms | +0.0064ms | +6.69% |
| max | 0.16ms | 0.18ms | -0.02ms | -9.27% |
| total | 2.54ms | 2.52ms | +0.01ms | +0.53% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.10ms |
| p99 | 0.11ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.11ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.01ms | -29.30% |
| p50 | 0.03ms | 0.04ms | -0.0090ms | -22.29% |
| p95 | 0.10ms | 0.05ms | +0.05ms | +97.60% |
| p99 | 0.11ms | 0.06ms | +0.05ms | +94.58% |
| mean | 0.04ms | 0.04ms | -0.0024ms | -5.68% |
| min | 0.03ms | 0.04ms | -0.01ms | -28.54% |
| max | 0.11ms | 0.06ms | +0.05ms | +93.92% |
| total | 0.79ms | 0.83ms | -0.05ms | -5.68% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0057ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 0.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0046ms | +14.57% |
| p50 | 0.04ms | 0.03ms | +0.0087ms | +27.17% |
| p95 | 0.05ms | 0.05ms | +0.0018ms | +3.81% |
| p99 | 0.06ms | 0.09ms | -0.04ms | -37.74% |
| mean | 0.04ms | 0.04ms | +0.0039ms | +10.28% |
| min | 0.04ms | 0.03ms | +0.0047ms | +15.30% |
| max | 0.06ms | 0.11ms | -0.04ms | -42.47% |
| total | 0.83ms | 0.76ms | +0.08ms | +10.28% |

