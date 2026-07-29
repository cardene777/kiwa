# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 1.19ms | 2.36ms | 300ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| concurrent_read_batch (5 GET via Promise.all) | 0.33ms | 0.53ms | 300ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_error_handling (5 GET /fail 500 responses) | 0.36ms | 0.69ms | 300ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 5.54ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 0.99ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 2.31ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 7048 B | 0 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -5112 B | 0 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -656 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 1.19ms |
| p50 | 1.51ms |
| p95 | 2.36ms |
| p99 | 2.43ms |
| mean | 1.64ms |
| stdev | 0.38ms |
| min | 1.04ms |
| max | 2.44ms |
| total | 49.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.19ms | 1.68ms | -0.49ms | -29.15% |
| p50 | 1.51ms | 2.06ms | -0.56ms | -26.98% |
| p95 | 2.36ms | 3.09ms | -0.72ms | -23.40% |
| p99 | 2.43ms | 3.47ms | -1.04ms | -29.91% |
| mean | 1.64ms | 2.13ms | -0.49ms | -22.85% |
| min | 1.04ms | 1.26ms | -0.22ms | -17.52% |
| max | 2.44ms | 3.50ms | -1.06ms | -30.27% |
| total | 49.22ms | 63.81ms | -14.58ms | -22.85% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.33ms |
| p50 | 0.37ms |
| p95 | 0.53ms |
| p99 | 0.66ms |
| mean | 0.39ms |
| stdev | 0.08ms |
| min | 0.33ms |
| max | 0.70ms |
| total | 11.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.33ms | 0.35ms | -0.01ms | -3.73% |
| p50 | 0.37ms | 0.37ms | -0.0038ms | -1.04% |
| p95 | 0.53ms | 0.63ms | -0.11ms | -16.91% |
| p99 | 0.66ms | 0.83ms | -0.17ms | -20.57% |
| mean | 0.39ms | 0.42ms | -0.03ms | -6.39% |
| min | 0.33ms | 0.32ms | +0.0036ms | +1.12% |
| max | 0.70ms | 0.89ms | -0.19ms | -21.17% |
| total | 11.75ms | 12.55ms | -0.80ms | -6.39% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.36ms |
| p50 | 0.40ms |
| p95 | 0.69ms |
| p99 | 0.76ms |
| mean | 0.45ms |
| stdev | 0.11ms |
| min | 0.36ms |
| max | 0.77ms |
| total | 13.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.36ms | 0.36ms | +0.0062ms | +1.76% |
| p50 | 0.40ms | 0.40ms | -0.00060ms | -0.15% |
| p95 | 0.69ms | 0.75ms | -0.06ms | -7.45% |
| p99 | 0.76ms | 0.81ms | -0.05ms | -6.63% |
| mean | 0.45ms | 0.47ms | -0.02ms | -4.05% |
| min | 0.36ms | 0.35ms | +0.0068ms | +1.95% |
| max | 0.77ms | 0.83ms | -0.06ms | -6.99% |
| total | 13.41ms | 13.97ms | -0.57ms | -4.05% |

